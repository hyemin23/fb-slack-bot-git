export const getRandomMenu = (menu: Array<string>): number | string => {
  if (menu.length > 0) {
    return Math.floor(Math.random() * menu.length);
  }
  return "오류";
};
