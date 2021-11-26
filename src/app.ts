import { getDustAPI } from "./weather/dust/index";
import { getFortune } from "./fortune/index";
import { getWeather } from "./weather/index";
import { getRandomMenu } from "./utils/event";
import "./utils/env";
import { App, LogLevel, SocketModeReceiver } from "@slack/bolt";
import { isGenericMessageEvent } from "./utils/helpers";
import { getFoodAPI, getSaladAPI } from "./food";
import cron from "node-cron";
import { Pool } from "pg";

// heroku url api endpoint
const url = "https://fb-slack-bot.herokuapp.com/";
const channel = "fb_free";
const port = Number(process.env.PORT) || 5000;
const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect();

const launchTask = cron.schedule(
  "30 12 * * 1-5",
  function () {
    send(
      "점심 먹으러 가요! 제가 추천해드릴게요. 😊 `점심`을 입력해보세요. ",
      channel
    );
  },
  {
    scheduled: false,
  }
);
const firstDayTask = cron.schedule(
  "30 09 * * 1-5",
  function () {
    send("좋은 아침입니다 💪🏻", channel);
  },
  {
    scheduled: false,
  }
);
const finalDayTask = cron.schedule(
  "30 18 * * 1-5",
  function () {
    send("🙌🏻  오늘도 고생하셨어요 !! 🙌🏻 ", channel);
  },
  {
    scheduled: false,
  }
);

// 9시 58분, 1시 58분, 5시 58분, 11시58분 매일
const eventTask = cron.schedule(
  "* */58 9,13,17,23 * * *",
  () => {
    send("blackfriday event", "future_bot_test");
  },
  {
    scheduled: false,
  }
);

// x-mas
// const xmasEventTask = cron.schedule(
//   `0 0 0 25 12 ?`,
//   () => {
// let xMasValid = cron.validate("0 0 0 25 12 ?");
//     send("🎁 !!! `퓨처뷰티 여러분 `Merry Christmas !!! 🎁 ", channel);
//   },
//   {
//     scheduled: false,
//   }
// );

interface SlackRes {
  message: any;
  say: any;
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // logLevel: LogLevel.DEBUG,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});
app.use(async ({ next }) => {
  // TODO: This can be improved in future versions
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await next!();
});

(async () => {
  await app.start(port);

  eventTask.start();
  launchTask.start();
  firstDayTask.start();
  finalDayTask.start();

  console.log("⚡️ Bolt app is running!");
})();

app.message("knock knock", async ({ message, say }) => {
  await say({
    icon_emoji: ":santa:",
    username: "나나봇",
    text: `_Who's there?_`,
  });
});

// 미세먼지
app.message(/(미세먼지)/g, async ({ say }) => {
  const result = await getDustAPI();
  await say({
    icon_emoji: ":santa:",
    username: "나나봇",
    text:
      result.sidoName +
      "미세먼지 정보 " +
      result.date +
      " " +
      result.hour +
      " 시 기준 " +
      " `" +
      result.pm25Grade1h +
      "` " +
      "입니다.",
  });
});

// 오늘의 운세
app.message(/(운세)/g, async ({ message, say }: SlackRes) => {
  const { text } = message;
  const result = await getFortune(text.split(" ")[0]);
  await say({
    icon_emoji: ":santa:",
    username: "나나봇",
    text: `🎴 오늘 ${text.split(" ")[0]}의 운세는🎴 : ${result}`,
  });
});

// 점심시간 알림
const send = (text, channel) => {
  app.client.chat.postMessage({
    username: "나나봇",
    text: text,
    channel,
    icon_emoji: ":santa:",
  });
};

// team 참가
app.event("team_join", async ({ event, client }) => {
  try {
    const result = await client.chat.postMessage({
      channel: "fb_free",
      text: `🎉 <@${event.user.id}> 님이 슬랙에 가입하셨습니다. 채널에 초대해 환영해주세요. 🎉 `,
    });
  } catch (error) {
    console.error(error);
  }
});

// Publish a App Home
app.event("app_home_opened", async ({ event, client }) => {
  await client.views.publish({
    user_id: event.user,
    view: {
      type: "home",
      blocks: [
        {
          type: "section",
          block_id: "section678",
          text: {
            type: "mrkdwn",
            text: "App Home Published",
          },
        },
      ],
    },
  });
});

app.message(/^(날씨|기상).*/, async ({ say }) => {
  const temp = await getWeather();
  await say({
    icon_emoji: ":santa:",
    username: "나나봇",
    text: `현재 기온은 ${temp}도 입니다.`,
  });
});

const textMsg = (msg: string) => {
  const text = {
    icon_emoji: ":santa:",
    username: "나점심",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: msg,
        },
      },
    ],
    text: " ",
  };
  return text;
};

// 점심 메뉴 추가
app.message(/^(메뉴추가)/g, async ({ message, say }: SlackRes) => {
  const { text } = await message;
  const menuName = text.split(" ")[1];
  const menuShopName = text.split(" ")[2];

  // 메뉴 이름만 존재
  try {
    if (!!menuName) {
      const result = await connection.query(
        `INSERT INTO menu (id,menu) VALUES(DEFAULT,'${menuName}') RETURNING id`
      );

      result.rowCount === 1 && say(textMsg("메뉴등록 완료!"));

      // 메뉴이름 & 가게이름 존재
      if (!!menuName && !!menuShopName) {
        const result = await connection.query(
          `INSERT INTO menu (id,menu,name) VALUES(DEFAULT,'${menuName}','${menuShopName}')RETURNING id`
        );
        result.rowCount === 1 && say(textMsg("메뉴등록 완료!"));
      }
    } else {
      say(
        textMsg(
          "ex) 메뉴추가 `음식이름(필수) 가게이름(선택)` 과 같이 입력해주세요!"
        )
      );
    }
  } catch (error) {
    console.error(error);
    say(textMsg("중복된 메뉴가 존재합니다."));
  }
});

// 점심 추천
app.message(/^(점심|점심추천|점심 추천).*/, async ({ context, say }) => {
  await connection.query("SELECT menu,name,location FROM menu", (err, res) => {
    if (err) throw err;

    // 여기서 random 로직을 돌게 하자
    const dbMenu = res.rows.map((data) => {
      return {
        name: data.name,
        menu: data.menu,
        location: data.location,
      };
    });

    let randomNumber = null;
    randomNumber = getRandomMenu(dbMenu);

    if (
      typeof randomNumber !== "string" &&
      typeof randomNumber !== "undefined"
    ) {
      say({
        icon_emoji: ":santa:",
        username: "나점심",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "오늘의 점심은 " +
                " `" +
                dbMenu[randomNumber - 1].menu +
                "` " +
                "입니다.",
            },
            accessory: {
              type: "button",
              value: `${dbMenu[randomNumber - 1].menu}`,
              text: {
                type: "plain_text",
                text: "맛집 리스트 보기",
              },
              action_id: "view_menu_list",
            },
          },
        ],
        text: " ",
      });
    }
  });
});

// ^(점심|점심추천|점심 추천).*/
app.message(
  /^(샐러드 추천|샌드위치 추천).*/,
  async ({ message, say }: SlackRes) => {
    if (message.text.includes("샐러드")) {
      const result = await getSaladAPI("샐러드");
    } else if (message.text.includes("샌드위치")) {
      const result = await getSaladAPI("샌드위치");
    }
  }
);

app.action("view_menu_list", async ({ action, ack, say, context }: any) => {
  const { searchedQuery, newArr, testArr }: any = await getFoodAPI(
    action.value
  );

  // 문자열 변수를 선언해서 이 안에 넣기
  await say({
    icon_emoji: ":santa:",
    username: "나점심",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${searchedQuery}* 맛집 정보`,
        },
      },
      {
        type: "divider",
      },
      ...newArr.infoArr,
      ...newArr.locationArr,
      {
        type: "divider",
      },
    ],
  });
});

// Listens to incoming messages that contain "hello"
app.message("나봇아 안녕", async ({ message, say }: SlackRes) => {
  await say({
    icon_emoji: ":santa:",
    username: "Nabot",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `안녕하세요 <@${message.user}> 님!`,
        },
      },
    ],
    text: `안녕하세요 <@${message.user}> 님 !`,
  });

  if (!isGenericMessageEvent(message)) return;
});

app.event("app_mention", async ({ event, context, client, say, message }) => {
  // 나중에 멘션으로 모든 로직 합치기
  // if (message.includes("ㅁㄴ ")) {
  // }

  try {
    await say({
      icon_emoji: ":santa:",
      username: "Nabot",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `귀찮게 하지 마세요... <@${event.user}>님..`,
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});

app.command("/추천", async ({ command, ack, respond, say }) => {
  try {
    await respond(`${command.text}`);
    await say({
      icon_emoji: ":santa:",
      username: "Nabot",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `asd`,
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});
