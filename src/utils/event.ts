export const getRandomMenu = (menu: Array<object>): number | string => {
  if (menu.length > 0) {
    const randomNumber = Math.ceil(Math.random() * menu.length);
    return randomNumber;
  }
  return "오류";
};
