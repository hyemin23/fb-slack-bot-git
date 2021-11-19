import axios from "axios";
// 해당 지역 기준으로 맛집 리스트를 알려주는 api
/*
https://map.naver.com/v5/api/search?caller=pcweb&query=%EC%84%B1%EC%88%98%20%EC%A7%9C%EC%9E%A5%EB%A9%B4%20%EB%A7%9B%EC%A7%91&type=all&searchCoord=127.0158683;37.5410154&page=1&displayCount=20&isPlaceRecommendationReplace=true&lang=ko
*/
export const getFoodAPI = async (menu: string) => {
  const param = `성수 ${menu} 맛집`;

  const url = `https://map.naver.com/v5/api/search?caller=pcweb&query=${encodeURIComponent(
    param
  )}&type=all&searchCoord=127.0158683;37.5410154&page=1&displayCount=5&isPlaceRecommendationReplace=true&lang=ko`;

  const {
    data: {
      result: {
        metaInfo: { searchedQuery },
        place: { list },
      },
    },
  } = await axios.get(url);

  const testArr = list.map((data) => {
    const obj = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${data.name}*\n${data.menuInfo}\n${data.reviewCount}`,
        },
        accessory: {
          type: "image",
          image_url: `${data.thumUrl}`,
          alt_text: `${data.name} thumbnail`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url:
              "https://api.slack.com/img/blocks/bkb_template_images/tripAgentLocationMarker.png",
            alt_text: "Location Pin Icon",
          },
          {
            type: "plain_text",
            emoji: true,
            text: `${data.abbrAddress}`,
          },
        ],
      },
    ];

    return obj;
  });

  const infoArr = list.map((data) => {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${data.name}*\n${data.menuInfo}\n${data.reviewCount}`,
      },
      accessory: {
        type: "image",
        image_url: `${data.thumUrl}`,
        alt_text: `${data.name} thumbnail`,
      },
    };
  });

  const locationArr = list.map((data) => {
    return {
      type: "context",
      elements: [
        {
          type: "image",
          image_url:
            "https://api.slack.com/img/blocks/bkb_template_images/tripAgentLocationMarker.png",
          alt_text: "Location Pin Icon",
        },
        {
          type: "plain_text",
          emoji: true,
          text: `${data.abbrAddress}`,
        },
      ],
    };
  });

  return {
    searchedQuery,
    newArr: {
      infoArr,
      locationArr,
    },
    testArr,
  };
};
