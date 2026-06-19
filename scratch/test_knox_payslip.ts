import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local') });

import { PayrollServiceServer } from '../src/services/PayrollServiceServer';

async function main() {
    try {
        const clientId = 'Nt6RiGoHounSUkh7JqvV';
        const employeeId = 'XKElzMO7FdGlKniX0aZk'; // KNOX
        const basicSalary = 147;
        
        console.log("Running generateInitialPayslip...");
        const res = await PayrollServiceServer.generateInitialPayslip(clientId, employeeId, basicSalary);
        console.log("Result:", res);
    } catch (e: any) {
        console.error("Caught error during generation:", e.message);
        console.error(e.stack);
    }
}

main();
