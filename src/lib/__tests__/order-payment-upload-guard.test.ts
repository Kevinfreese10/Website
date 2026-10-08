import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../../..');

describe('Unpaid Order Document Upload & Communication Guards', () => {
  describe('Client Order Actions Guardrails', () => {
    const clientActionsSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/app/actions/client-order-actions.ts'),
      'utf-8'
    );

    it('enforces order.status !== Pending Payment in submitClientDocumentUploadAction', () => {
      expect(clientActionsSource).toContain("if (order.status === 'Pending Payment')");
      expect(clientActionsSource).toMatch(/submitClientDocumentUploadAction[\s\S]*?if\s*\(\s*order\.status\s*===\s*'Pending Payment'\s*\)/);
    });

    it('enforces order.status !== Pending Payment in removeClientDocumentFileAction', () => {
      expect(clientActionsSource).toMatch(/removeClientDocumentFileAction[\s\S]*?if\s*\(\s*order\.status\s*===\s*'Pending Payment'\s*\)/);
    });

    it('enforces order.status !== Pending Payment in syncClientQuestionnaireAction', () => {
      expect(clientActionsSource).toMatch(/syncClientQuestionnaireAction[\s\S]*?if\s*\(\s*order\.status\s*===\s*'Pending Payment'\s*\)/);
    });

    it('enforces order.status !== Pending Payment in notifyConsultantAndVerifyAction', () => {
      expect(clientActionsSource).toMatch(/notifyConsultantAndVerifyAction[\s\S]*?if\s*\(\s*order\.status\s*===\s*'Pending Payment'\s*\)/);
    });
  });

  describe('Order Admin Actions Guardrails', () => {
    const adminActionsSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/app/actions/order-admin-actions.ts'),
      'utf-8'
    );

    it('blocks requestCustomDocumentAtomic if order is Pending Payment', () => {
      expect(adminActionsSource).toMatch(/requestCustomDocumentAtomic[\s\S]*?if\s*\(\s*orderData\.status\s*===\s*'Pending Payment'\s*\)/);
    });
  });

  describe('Client Portal UI Order View Guards', () => {
    const clientOrderPageSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/app/dashboard/orders/[orderId]/page.tsx'),
      'utf-8'
    );

    it('suppresses the allSubmitted review banner when order is Pending Payment', () => {
      expect(clientOrderPageSource).toContain("allSubmitted && order.status !== 'Pending Payment'");
    });

    it('renders a locked payment card instead of document upload inputs for unpaid orders', () => {
      expect(clientOrderPageSource).toContain("order.status === 'Pending Payment' ?");
      expect(clientOrderPageSource).toContain('Payment Required to Unlock Document Submission');
      expect(clientOrderPageSource).toContain('Complete Payment Now');
    });

    it('guards CardFooter intake submission button from appearing when order is Pending Payment', () => {
      expect(clientOrderPageSource).toContain("order.status !== 'Pending Payment' && allRequirements.length > 0");
    });
  });

  describe('Proofread AI & Communication Templates Friendly Tone', () => {
    const proofreadSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/ai/flows/proofread-note.ts'),
      'utf-8'
    );
    const adminOrderPageSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/app/admin/orders/[id]/page.tsx'),
      'utf-8'
    );

    it('proofread prompt requires warm greeting and friendly professional tone without stripping greetings', () => {
      expect(proofreadSource).toContain('Warm Greeting');
      expect(proofreadSource).toContain('Friendly & Welcoming Tone');
      expect(proofreadSource).not.toContain('Do NOT add any formal greetings or closings');
    });

    it('admin review request template is warm, appreciative, and includes Google review link', () => {
      expect(adminOrderPageSource).toContain('It was truly a pleasure assisting you with order');
      expect(adminOrderPageSource).toContain('https://g.page/r/CVIOzn2bYoiaEAE/review');
      expect(adminOrderPageSource).toContain('Warm regards,');
    });

    it('admin payment follow-up template has friendly, helpful tone', () => {
      expect(adminOrderPageSource).toContain("Hope you're having a wonderful week!");
      expect(adminOrderPageSource).toContain('gentle follow-up regarding the outstanding invoice');
    });
  });
});
