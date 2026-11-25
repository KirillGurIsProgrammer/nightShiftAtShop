import { describe, expect, it } from 'vitest';
import { VisitManager, canCompleteVisit } from '../../src/systems/npc/VisitManager';

describe('active visit lifecycle', () => {
  it('blocks visit completion until approved fuel and payment are finished', () => {
    const visits = new VisitManager();
    const visit = visits.create('npc_test', 3, null);
    visits.receiveRequest(visit);
    visits.startConversation(visit);

    expect(canCompleteVisit(visit)).toBe(false);
    visits.completeConversation(visit);
    visits.beginInspection(visit);
    visits.completeInspection(visit);
    visits.makeDecision(visit, true);

    expect(canCompleteVisit(visit)).toBe(false);
    visits.startFueling(visit);
    visits.finishFueling(visit);
    visit.progress.paymentCompleted = true;

    expect(canCompleteVisit(visit)).toBe(true);
  });

  it('requires purchase and payment when an item was requested', () => {
    const visits = new VisitManager();
    const visit = visits.create('npc_test', 2, 'water');
    visits.completeConversation(visit);
    visits.completeInspection(visit);
    visits.makeDecision(visit, true);
    visits.finishFueling(visit);

    expect(canCompleteVisit(visit)).toBe(false);
    visits.completePurchase(visit);
    visits.completePayment(visit);

    expect(canCompleteVisit(visit)).toBe(true);
  });

  it('allows refusal completion without fuel or purchase', () => {
    const visits = new VisitManager();
    const visit = visits.create('npc_test', 1, 'water');
    visits.makeDecision(visit, false, 'Mismatch');

    expect(canCompleteVisit(visit)).toBe(true);
  });
});
