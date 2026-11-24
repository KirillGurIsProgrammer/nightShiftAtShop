export interface Customer {
  name: string;
  face: string;
  skin: string;
  clothes: string;
  clothesName: string;
  hat: "Кепка" | "Шляпа" | "Капюшон" | "Нет";
  behavior: string;
  dangerous: boolean;
}

export const customerTemplates: readonly Customer[] = [
  { name: "Иван", face: "Обычное", skin: "#c98f72", clothes: "#4d6177", clothesName: "Серая куртка", hat: "Кепка", behavior: "Спокойное", dangerous: false },
  { name: "Мария", face: "Обычное", skin: "#ddb08f", clothes: "#756d55", clothesName: "Бежевая рубашка", hat: "Нет", behavior: "Нервное", dangerous: false },
  { name: "Пётр", face: "Уставшее", skin: "#b68a72", clothes: "#4b4d5a", clothesName: "Тёмная форма", hat: "Шляпа", behavior: "Спокойное", dangerous: false },
  { name: "Анна", face: "Обычное", skin: "#e0b69a", clothes: "#65745f", clothesName: "Зелёная куртка", hat: "Капюшон", behavior: "Нормальное", dangerous: false },
  { name: "Олег", face: "Чёрные глаза", skin: "#a9a99f", clothes: "#30363b", clothesName: "Чёрная куртка", hat: "Нет", behavior: "Неподвижное", dangerous: true },
  { name: "Без лица", face: "Нет лица", skin: "#bdc2b8", clothes: "#2f3231", clothesName: "Чёрный плащ", hat: "Капюшон", behavior: "Неподвижное", dangerous: true },
  { name: "Красный", face: "Грубые черты", skin: "#8c2f26", clothes: "#6d3d36", clothesName: "Красная рубашка", hat: "Нет", behavior: "Агрессивное", dangerous: true },
  { name: "Гость-7", face: "Чёрные глаза", skin: "#718079", clothes: "#41484e", clothesName: "Серая форма", hat: "Кепка", behavior: "Странное", dangerous: true },
  { name: "Сергей", face: "Обычное", skin: "#c79772", clothes: "#5d6f66", clothesName: "Хаки", hat: "Нет", behavior: "Торопливое", dangerous: false },
  { name: "Лена", face: "Обычное", skin: "#e1b28f", clothes: "#6d7181", clothesName: "Синяя куртка", hat: "Шляпа", behavior: "Спокойное", dangerous: false },
  { name: "Невидимый", face: "Нет лица", skin: "#cfd2c7", clothes: "#3f4742", clothesName: "Серый плащ", hat: "Капюшон", behavior: "Странное", dangerous: true },
  { name: "Василий", face: "Грубые черты", skin: "#9d2f25", clothes: "#2f3437", clothesName: "Тёмная куртка", hat: "Кепка", behavior: "Агрессивное", dangerous: true },
  { name: "Юрий", face: "Улыбка", skin: "#b98b69", clothes: "#526057", clothesName: "Зелёная рубашка", hat: "Шляпа", behavior: "Дружелюбное", dangerous: false },
  { name: "Кира", face: "Обычное", skin: "#d0a184", clothes: "#6b626f", clothesName: "Фиолетовая куртка", hat: "Нет", behavior: "Спокойное", dangerous: false },
  { name: "Тень", face: "Чёрные глаза", skin: "#67716d", clothes: "#242a28", clothesName: "Чёрная форма", hat: "Капюшон", behavior: "Агрессивное", dangerous: true },
  { name: "Странник", face: "Нет лица", skin: "#aa2f2a", clothes: "#4d2925", clothesName: "Красная куртка", hat: "Кепка", behavior: "Агрессивное", dangerous: true }
];

export function createCustomerQueue(count = 8): Customer[] {
  const queue = [...customerTemplates];
  for (let index = queue.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [queue[index], queue[randomIndex]] = [queue[randomIndex], queue[index]];
  }
  return queue.slice(0, count);
}
