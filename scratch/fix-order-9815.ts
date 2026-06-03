import { getAdminDb } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from '../src/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { services as allServices } from '../src/lib/data';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function fixOrder() {
  const db = getAdminDb();
  const orderId = '9815';
  
  console.log(`Starting manual payment resolution for Order #${orderId}...`);
  
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) {
    console.error(`Order #${orderId} not found in Firestore.`);
    return;
  }
  
  const orderData = orderSnap.data() as any;
  
  // 1. Update basic payment method and status
  await orderRef.update({
    status: 'Processing',
    paymentMethod: 'PayFast',
    itnHistory: FieldValue.arrayUnion({
      status: 'Success',
      message: 'Payment manually verified via PayFast query API validation. Order set to Processing.',
      receivedAt: new Date(),
      payload: {
        manual_fix: true,
        reason: 'ITN rejected due to old build signature mismatch, validated manually via PayFast'
      }
    })
  });
  console.log('Order status set to "Processing" and paymentMethod set to "PayFast".');

  // 2. Staff Workload Querying & Load-Balanced Allocation
  try {
      let department: 'Accounting and Tax' | 'Administration' | 'CAP' = 'Administration';
      
      if (orderData.department) {
          department = orderData.department;
      } else {
          const itemIds = orderData.items.map((i: any) => i.id);
          for (const itemId of itemIds) {
              const service = allServices.find(s => s.id === itemId);
              if (service && service.department) {
                  department = service.department as any;
                  break;
              }
          }
      }
      
      console.log(`Allocating staff for order ${orderId} in department ${department}`);
      
      const staffSnapshot = await db.collection('users')
          .where('role', '==', 'staff')
          .get();
      
      const matchingStaff = staffSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .filter(staff => {
              if (staff.status === 'Inactive' || staff.status === 'Archived') return false;
              if (staff.department === department) return true;
              if (Array.isArray(staff.departments) && staff.departments.includes(department)) return true;
              return false;
          });
      
      let assignedStaffId: string | null = null;
      
      if (matchingStaff.length > 0) {
          const processingOrdersSnapshot = await db.collection('orders')
              .where('status', '==', 'Processing')
              .get();
          
          const workloadMap: { [userId: string]: number } = {};
          matchingStaff.forEach(staff => {
              workloadMap[staff.id] = 0;
          });
          
          processingOrdersSnapshot.docs.forEach(doc => {
              const oData = doc.data();
              const assigned = oData.assignedTo;
              if (Array.isArray(assigned)) {
                  assigned.forEach((staffId: string) => {
                      if (workloadMap[staffId] !== undefined) {
                          workloadMap[staffId]++;
                      }
                  });
              } else if (typeof assigned === 'string') {
                  if (workloadMap[assigned] !== undefined) {
                      workloadMap[assigned]++;
                  }
              }
          });
          
          let minWorkload = Infinity;
          matchingStaff.forEach(staff => {
              const workload = workloadMap[staff.id] || 0;
              if (workload < minWorkload) {
                  minWorkload = workload;
                  assignedStaffId = staff.id;
              }
          });
      } else {
          console.warn(`No staff found for department ${department}. Checking general active staff.`);
          const generalStaff = staffSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as User))
              .filter(staff => staff.status !== 'Inactive' && staff.status !== 'Archived');
          
          if (generalStaff.length > 0) {
              const processingOrdersSnapshot = await db.collection('orders')
                  .where('status', '==', 'Processing')
                  .get();
              
              const workloadMap: { [userId: string]: number } = {};
              generalStaff.forEach(staff => {
                  workloadMap[staff.id] = 0;
              });
              
              processingOrdersSnapshot.docs.forEach(doc => {
                  const oData = doc.data();
                  const assigned = oData.assignedTo;
                  if (Array.isArray(assigned)) {
                      assigned.forEach((staffId: string) => {
                          if (workloadMap[staffId] !== undefined) {
                              workloadMap[staffId]++;
                          }
                      });
                  } else if (typeof assigned === 'string') {
                      if (workloadMap[assigned] !== undefined) {
                          workloadMap[assigned]++;
                      }
                  }
              });
              
              let minWorkload = Infinity;
              generalStaff.forEach(staff => {
                  const workload = workloadMap[staff.id] || 0;
                  if (workload < minWorkload) {
                      minWorkload = workload;
                      assignedStaffId = staff.id;
                  }
              });
          }
      }
      
      if (assignedStaffId) {
          const staffUser = staffSnapshot.docs.find(d => d.id === assignedStaffId)?.data() as User;
          const staffName = staffUser ? staffUser.name : 'Unknown Staff';
          
          console.log(`Assigning order ${orderId} to staff member ${staffName} (${assignedStaffId})`);
          
          await orderRef.update({
              assignedTo: [assignedStaffId],
              department: department,
              notes: FieldValue.arrayUnion({
                  text: `Order automatically assigned to ${staffName} (Department: ${department}) based on least active workload (Manual Fix).`,
                  date: new Date(),
                  authorId: 'system',
                  type: 'note',
                  subject: null,
                  attachments: null,
              })
          });
          
          const taskRef = db.collection('tasks').doc();
          await taskRef.set({
              id: taskRef.id,
              title: `Order #${orderId} - Fulfill Services`,
              description: `Please fulfill the following services for ${orderData.customerName}:\n` + 
                  orderData.items.map((item: any) => `- ${item.title} (Qty: ${item.quantity})`).join('\n'),
              assignedTo: [assignedStaffId],
              createdBy: 'system',
              createdAt: FieldValue.serverTimestamp(),
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              priority: 'Medium',
              status: 'To-Do',
              orderId: orderId,
              clientId: orderData.userId || null,
              clientSource: orderData.source || 'Client',
              department: department,
              comments: []
          });
          
          console.log(`Task ${taskRef.id} successfully created and assigned to ${staffName}`);
      } else {
          console.warn(`No staff available at all. Order ${orderId} remains unassigned.`);
          await orderRef.update({
              department: department,
              notes: FieldValue.arrayUnion({
                  text: `Order set to department: ${department}. Could not assign staff (no active staff members found).`,
                  date: new Date(),
                  authorId: 'system',
                  type: 'note',
                  subject: null,
                  attachments: null,
              })
          });
      }
  } catch (allocationError) {
      console.error(`Error during staff allocation/task creation for order ${orderId}:`, allocationError);
  }
}

fixOrder().then(() => {
  console.log('Finished.');
  process.exit(0);
});
