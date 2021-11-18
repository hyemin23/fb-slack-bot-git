import axios from "axios";
import cheerio from "cheerio";

export const getFortune = async (animal) => {
  const param = animal + "운세";
  console.log("param", param);
  const query = `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&qvt=0&query=${encodeURIComponent(
    param
  )}`;
  const { data } = await axios(query);
  if (data) {
    const $ = cheerio.load(data);
    const result = $(".detail").children(":eq(2)").text();

    if (result === "") {
      return " 입력 오류 ex)`돼지띠 운세` 와 같이 입력해주세요.";
    }
    return result;
  }
};
