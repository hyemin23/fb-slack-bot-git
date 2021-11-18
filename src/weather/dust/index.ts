import axios from "axios";

export const getDustAPI = async () => {
  let url =
    "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty";
  let dustKey = process.env.DUST_KEY;

  const all_url =
    url +
    "?serviceKey=" +
    dustKey +
    "&returnType=json" +
    "&pageNo=1&numOfRows=1&sidoName=" +
    encodeURIComponent("서울") +
    "&ver=1.3";

  const {
    data: {
      response: {
        body: { items },
      },
    },
  } = await axios.get(all_url);
  let { dataTime, sidoName, pm25Grade1h } = items[0];

  switch (pm25Grade1h) {
    case "1":
      pm25Grade1h = "좋음🙂";
      break;
    case "2":
      pm25Grade1h = "보통😮";
      break;
    case "3":
      pm25Grade1h = "나쁨😷";
      break;
    case "4":
      pm25Grade1h = "매우나쁨😷";
      break;
  }

  const date = dataTime.split(" ")[0];
  const hour = dataTime.split(" ")[1];

  return {
    date,
    hour,
    sidoName,
    pm25Grade1h,
  };
};
