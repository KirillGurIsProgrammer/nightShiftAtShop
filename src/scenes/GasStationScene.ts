import { Application, Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { EventBus } from '../core/EventBus';

export class GasStationScene {
  readonly container = new Container();
  private readonly rain = new Container();
  private readonly visitor = new Container();
  private noticeboard!: Graphics;
  private monitor!: Graphics;

  constructor(private readonly app: Application, private readonly events: EventBus) {
    this.buildRoom();
    this.buildNoticeboard();
    this.buildVisitor();
    this.buildComputer();
    this.buildCounter();
    this.app.stage.addChild(this.container);
  }

  update(deltaSeconds: number): void {
    // NPC position is deliberately not modified here. Only the rain and optional
    // child-local visual details may animate; the character stays at its world-space stand point.
    for (const child of this.rain.children) {
      child.y += 95 * deltaSeconds;
      if (child.y > 295) child.y = -15;
    }
  }

  setObservationMode(active: boolean): void {
    this.visitor.alpha = active ? 1 : 0.9;
  }

  setVisitorVisible(visible: boolean): void {
    this.visitor.visible = visible;
  }

  private buildRoom(): void {
    const wall = new Graphics().rect(0, 0, 960, 540).fill(0x15191a);
    wall.rect(0, 62, 960, 265).fill(0x252b28);
    wall.rect(0, 327, 960, 213).fill(0x30271f);
    this.container.addChild(wall);

    const backWindow = new Graphics()
      .rect(330, 70, 300, 210)
      .fill(0x0b1518)
      .stroke({ width: 10, color: 0x343936 });
    backWindow.rect(342, 82, 276, 186).fill(0x14252a);
    backWindow.rect(342, 210, 276, 58).fill(0x1b2527);
    backWindow.rect(476, 82, 5, 186).fill(0x343936);
    this.container.addChild(backWindow);

    for (let i = 0; i < 42; i += 1) {
      const x = 342 + ((i * 53) % 276);
      const y = 82 + ((i * 37) % 186);
      const drop = new Graphics().moveTo(x, y).lineTo(x - 3, y + 9).stroke({ width: 1, color: 0x87a7ad, alpha: 0.18 });
      this.rain.addChild(drop);
    }
    this.container.addChild(this.rain);

    const ceilingLamp = new Graphics()
      .circle(480, 56, 74).fill({ color: 0xd2bd79, alpha: 0.07 })
      .rect(438, 24, 84, 12).fill(0x555347)
      .circle(480, 43, 7).fill(0xe4d49a);
    this.container.addChild(ceilingLamp);

    const sign = new Text({ text: 'НОЧНАЯ СМЕНА', style: { fontFamily: 'monospace', fontSize: 12, fill: 0xa4aea7, letterSpacing: 3 } });
    sign.position.set(376, 46);
    this.container.addChild(sign);
  }

  private buildNoticeboard(): void {
    this.noticeboard = new Graphics()
      .rect(38, 112, 220, 205)
      .fill(0x4c483b)
      .stroke({ width: 8, color: 0x1b1b17 });
    this.noticeboard.rect(53, 128, 190, 174).fill(0x756d55);

    const papers = [
      { x: 66, y: 142, w: 72, h: 58, c: 0xd1ccb0 },
      { x: 150, y: 137, w: 76, h: 68, c: 0xbac2ad },
      { x: 70, y: 216, w: 68, h: 70, c: 0xc9bda0 },
      { x: 151, y: 223, w: 78, h: 58, c: 0xd6d0b5 },
    ] as const;
    papers.forEach((paper, index) => {
      this.noticeboard.rect(paper.x, paper.y, paper.w, paper.h).fill(paper.c);
      this.noticeboard.circle(paper.x + 9, paper.y + 8, 3).fill(index % 2 ? 0x6f5f43 : 0x7f2f2f);
      for (let line = 0; line < 3; line += 1) {
        this.noticeboard.rect(paper.x + 18, paper.y + 22 + line * 9, paper.w - 30 - line * 5, 2).fill(0x77745f);
      }
    });

    this.noticeboard.eventMode = 'static';
    this.noticeboard.cursor = 'pointer';
    this.noticeboard.on('pointerover', () => this.events.emit('ui.tooltip', { text: 'Доска объявлений', visible: true }));
    this.noticeboard.on('pointerout', () => this.events.emit('ui.tooltip', { text: '', visible: false }));
    this.noticeboard.on('pointertap', () => this.events.emit('attention.mode', { mode: 'noticeboard' }));
    this.container.addChild(this.noticeboard);
  }

  private buildVisitor(): void {
    const STANDING_POINT = { x: 480, groundY: 350 };
    const VISITOR_SCALE = 0.82;
    const SPRITE_BOTTOM_OFFSET = 125;

    // The visitor container's position represents the bottom-center world-space anchor.
    // All visual parts remain local to this container; scaling never changes the anchor.
    this.visitor.position.set(STANDING_POINT.x, STANDING_POINT.groundY - SPRITE_BOTTOM_OFFSET * VISITOR_SCALE);
    this.visitor.scale.set(VISITOR_SCALE);

    const head = new Graphics().ellipse(0, -58, 43, 54).fill(0xb7a48e).stroke({ width: 4, color: 0x2a2a26 });
    head.ellipse(-13, -64, 5, 3).fill(0x3b4140);
    head.ellipse(13, -64, 5, 3).fill(0x3b4140);
    head.rect(-12, -39, 24, 3).fill(0x694f43);
    head.rect(-48, -93, 96, 20).fill(0x4b4f4b);
    head.rect(-44, -105, 88, 21).fill(0x5e625d);
    this.visitor.addChild(head);

    const body = new Graphics()
      .rect(-74, -5, 148, 130).fill(0x4b5552).stroke({ width: 5, color: 0x242827 });
    body.rect(-58, 12, 116, 12).fill(0x68716b);
    body.rect(-52, 54, 104, 9).fill(0x303936);
    body.rect(-16, 8, 32, 56).fill(0x7b6a59);
    body.circle(-55, 84, 18).fill(0x9a8a78);
    body.circle(55, 84, 18).fill(0x9a8a78);
    this.visitor.addChild(body);

    this.visitor.eventMode = 'static';
    this.visitor.hitArea = new Rectangle(-74, -105, 148, 230);
    this.visitor.cursor = 'pointer';
    this.visitor.on('pointerover', () => {
      this.visitor.alpha = 1;
      this.events.emit('ui.tooltip', { text: 'Поговорить с посетителем', visible: true });
    });
    this.visitor.on('pointerout', () => {
      this.visitor.alpha = 0.9;
      this.events.emit('ui.tooltip', { text: '', visible: false });
    });
    this.visitor.on('pointertap', () => this.events.emit('visitor.interact', { npcId: 'active' }));
    this.container.addChild(this.visitor);
    this.visitor.visible = false;
  }

  private buildComputer(): void {
    this.monitor = new Graphics()
      .rect(718, 145, 210, 145).fill(0x77796f).stroke({ width: 8, color: 0x171916 });
    this.monitor.rect(733, 160, 180, 112).fill(0x091411).stroke({ width: 3, color: 0x26352f });
    this.monitor.rect(806, 290, 34, 14).fill(0x34372f);
    this.monitor.rect(766, 304, 114, 26).fill(0x252923).stroke({ width: 5, color: 0x151712 });
    this.monitor.circle(902, 258, 4).fill(0x91b980);

    this.monitor.eventMode = 'static';
    this.monitor.cursor = 'pointer';
    this.monitor.on('pointerover', () => this.events.emit('ui.tooltip', { text: 'Компьютер оператора', visible: true }));
    this.monitor.on('pointerout', () => this.events.emit('ui.tooltip', { text: '', visible: false }));
    this.monitor.on('pointertap', () => this.events.emit('attention.mode', { mode: 'computer' }));
    this.container.addChild(this.monitor);
  }

  private buildCounter(): void {
    const counter = new Graphics()
      .rect(42, 350, 876, 190).fill(0x49392b).stroke({ width: 8, color: 0x211a14 });
    counter.rect(42, 350, 876, 24).fill(0x62503b);
    counter.rect(268, 374, 424, 166).fill(0x342b23).stroke({ width: 4, color: 0x211a14 });
    this.container.addChild(counter);

    const glassDivider = new Graphics()
      .rect(330, 286, 300, 64).fill({ color: 0x7f9d9a, alpha: 0.08 }).stroke({ width: 4, color: 0x1b2422 });
    this.container.addChild(glassDivider);
  }
}
