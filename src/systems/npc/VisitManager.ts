export type VisitState =
  | 'arriving'
  | 'waiting_at_window'
  | 'greeting'
  | 'request_received'
  | 'conversation'
  | 'inspection'
  | 'verification'
  | 'awaiting_decision'
  | 'approved'
  | 'refused'
  | 'fueling'
  | 'shopping'
  | 'payment'
  | 'completed'
  | 'departing';

export type FuelingState = 'not_started' | 'authorized' | 'in_progress' | 'finished';

export interface VisitProgress {
  requestReceived: boolean;
  conversationCompleted: boolean;
  inspectionCompleted: boolean;
  decisionMade: boolean;
  serviceAuthorized: boolean;
  fuelingCompleted: boolean;
  purchaseCompleted: boolean;
  paymentCompleted: boolean;
}

export interface Visit {
  id: number;
  npcId: string;
  state: VisitState;
  pumpId: number;
  purchaseItemId: string | null;
  refusalReason: string | null;
  fuelingState: FuelingState;
  progress: VisitProgress;
  dialogueHistory: string[];
}

export function createVisit(npcId: string, id: number, pumpId: number, purchaseItemId: string | null): Visit {
  return {
    id,
    npcId,
    state: 'arriving',
    pumpId,
    purchaseItemId,
    refusalReason: null,
    fuelingState: 'not_started',
    progress: {
      requestReceived: true,
      conversationCompleted: false,
      inspectionCompleted: false,
      decisionMade: false,
      serviceAuthorized: false,
      fuelingCompleted: false,
    
      purchaseCompleted: purchaseItemId ? false : true,
      paymentCompleted: false,
    },
    dialogueHistory: [],
  };
}

export function transitionVisit(visit: Visit, state: VisitState): void {
  visit.state = state;
}

export function canCompleteVisit(visit: Visit): boolean {
  if (visit.state === 'refused') {
    return visit.progress.decisionMade && !visit.progress.serviceAuthorized;
  }

  if (!visit.progress.requestReceived || !visit.progress.conversationCompleted) return false;
  if (!visit.progress.inspectionCompleted || !visit.progress.decisionMade) return false;
  if (!visit.progress.serviceAuthorized) return false;
  if (!visit.progress.fuelingCompleted) return false;
  if (!visit.progress.purchaseCompleted) return false;
  return visit.progress.paymentCompleted;
}

export class VisitManager {
  private nextVisitId = 1;

  create(npcId: string, pumpId: number, purchaseItemId: string | null): Visit {
    const visit = createVisit(npcId, this.nextVisitId++, pumpId, purchaseItemId);
    transitionVisit(visit, 'waiting_at_window');
    return visit;
  }

  receiveRequest(visit: Visit): void {
    visit.progress.requestReceived = true;
    transitionVisit(visit, 'request_received');
  }

  startConversation(visit: Visit): void {
    if (visit.state === 'request_received' || visit.state === 'greeting') transitionVisit(visit, 'conversation');
  }

  completeConversation(visit: Visit): void {
    visit.progress.conversationCompleted = true;
  }

  beginInspection(visit: Visit): void {
    transitionVisit(visit, 'inspection');
  }

  completeInspection(visit: Visit): void {
    visit.progress.inspectionCompleted = true;
    transitionVisit(visit, 'verification');
  }

  makeDecision(visit: Visit, approved: boolean, reason: string | null = null): void {
    visit.progress.decisionMade = true;
    visit.progress.serviceAuthorized = approved;
    if (approved) {
      visit.fuelingState = 'authorized';
      transitionVisit(visit, 'approved');
    } else {
      visit.refusalReason = reason;
      visit.progress.fuelingCompleted = true;
      transitionVisit(visit, 'refused');
    }
  }

  startFueling(visit: Visit): void {
    if (!visit.progress.serviceAuthorized) return;
    visit.fuelingState = 'in_progress';
    transitionVisit(visit, 'fueling');
  }

  finishFueling(visit: Visit): void {
    if (!visit.progress.serviceAuthorized) return;
    visit.fuelingState = 'finished';
    visit.progress.fuelingCompleted = true;
    transitionVisit(visit, visit.purchaseItemId ? 'shopping' : 'payment');
  }

  completePurchase(visit: Visit): void {
    if (!visit.purchaseItemId) {
      visit.progress.purchaseCompleted = true;
      return;
    }
    visit.progress.purchaseCompleted = true;
    transitionVisit(visit, 'payment');
  }

  completePayment(visit: Visit): void {
    visit.progress.paymentCompleted = true;
  }

  completeVisit(visit: Visit): boolean {
    if (!canCompleteVisit(visit)) return false;
    transitionVisit(visit, 'completed');
    transitionVisit(visit, 'departing');
    return true;
  }
}
