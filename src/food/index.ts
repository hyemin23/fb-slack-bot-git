import axios from "axios";

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

/*
https://map.naver.com/v5/api/search?caller=pcweb&query=%EC%84%B1%EC%88%98%20%EC%83%90%EB%9F%AC%EB%93%9C&type=all&searchCoord=127.0158683000003;37.541015399999786&page=1&displayCount=20&isPlaceRecommendationReplace=true&lang=ko
*/
// 샐러드 or 샌드위치 추천
export const getSaladAPI = async (menu: string) => {
  const url = `https://map.naver.com/v5/api/search?caller=pcweb&query=${encodeURIComponent(
    menu
  )}&type=all&searchCoord=127.0158683000003;37.541015399999786&page=1&displayCount=10&isPlaceRecommendationReplace=true&lang=ko`;

  const {
    data: {
      result: {
        metaInfo: { searchedQuery },
        reservationLabel: { preOrder },
        place: { list },
        homePage,
      },
    },
  } = await axios.get(url);
};
