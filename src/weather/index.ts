import moment from "moment-timezone";
import axios from "axios";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";

export const getWeather = async () => {
  const url =
    "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
  const secretKey = process.env.WEATHER_KEY;

  moment.tz.setDefault("Asia/Seoul");
  const date = moment().format("YYYYMMDD");
  // 기준 시간을 현재 기준시간으로 설정해야하는데
  const nx = "61";
  const ny = "127";
  const dataType = "JSON";
  const { base_time, base_date } = { ...getBaseDateTime() };

  // url
  const all_url =
    url +
    "?serviceKey=" +
    secretKey +
    "&dataType=" +
    dataType +
    "&base_date=" +
    date +
    "&base_time=" +
    base_time +
    "&nx=" +
    nx +
    "&ny=" +
    ny;

  const { data } = await axios.get(all_url, {
    params: {
      SecretKey: secretKey,
    },
  });

  if (!data.response) {
    console.log("응답값 없음.");
  } else {
    const { items } = data.response.body;

    const tempData = items.item.filter((data) => {
      const { category, obsrValue } = data;

      return category === "T1H" ? obsrValue : null;
    });

    if (!!tempData.length) {
      return tempData[0].obsrValue;
    }
  }
};

/*
- 하늘상태(SKY) 코드 : 맑음(1), 구름많음(3), 흐림(4)
- 강수형태(PTY) 코드 : 없음(0), 비(1), 비+눈(2), 눈(3), 소나기(4)
- 낙뢰(LGT) 초단기실황 코드: 없음(0), 있음(1)
- 낙뢰(LGT) 초단기예보 코드: 확률없음(0), 낮음(1), 보통(2), 높음(3)
*/

// 기본 시간정보 setting
const getBaseDateTime = (
  { minutes = 0, provide = 45 } = {},
  dt = Date.now()
) => {
  const pad = (n, pad = 2) => ("0".repeat(pad) + n).slice(-pad);

  // provide분 전
  const date = new Date(dt - provide * 60 * 1000);

  const base_date =
    date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
  const base_time = pad(date.getHours()) + pad(minutes);

  return {
    base_date,
    base_time,
  };
};

const weatherState = (ptyCode, skyCode) => {
  switch (ptyCode) {
    case 1:
      return "rainy";
    case 2:
      return "snowAndRainy";
    case 3:
      return "snow";
    case 4:
      return "rainy";
  }
  switch (skyCode) {
    case 1:
      return "clear";
    case 3:
      return "partlyClear";
    case 4:
      return "cloudy";
  }
};
