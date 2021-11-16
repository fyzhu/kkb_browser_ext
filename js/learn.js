let hostPrefix = "https://xiaoke.kaikeba.com/api/checkin/student";
let t;
window.addEventListener("popstate", () => {
  console.log("popstate change");
});
document.addEventListener("DOMContentLoaded", async function () {
  let href = location.href.split("/");
  let content_id = href.pop();
  let currentPage = href.pop();
  console.log("currentPage", currentPage);
  // 判断当前页面
  if (currentPage != "video") return;
  //  courseId + userId => pointId list + userId=> taskId 38640734699419693 + userId => 进度
  // courseId 220931 catalog 页 => sectionId => content_id 483238 video页 => content_title => name => pointId => taskId
  // courseInfo 课程信息
  // chapterInfo 章信息
  // section 节信息 打卡点 (节名和组名暂时来看相等，一节可能包含多个内容，一个内容可能包含多个视频片段)
  // group 组
  // content 内容
  // video 视频 片段
  // pointId 打卡点 一个打卡点可能包含多个任务 64736515743019159
  // taskId 打卡任务 44456317035769580
  /**
   * 1. 通过 content 信息查找 section_name
   * url 中拿到 content_id 510108
   * 通过 content 接口拿到 content 信息中的 chapter_id 229120  / section_id 92542
   * 通过 localstorage 拿到 courseinfo
   * 通过 chapter_id 229120  / section_id 92542  从 courseinfo 中查找 section_name
   * 2. 通过 section_name 查找 point 信息
   * 通过 pointList 接口拿到 pointList
   * 在 pointList 中查找 section_name
   * content_list {
   *  content_id,
   *  content_title
   * }
   * pointList {
   *  pointid,
   *  name(section_name / group_name)
   * }
   **/

  let userId = localStorage.getItem("uid"),
    courseInfo = JSON.parse(localStorage.getItem("courseInfo")),
    taskId = "";
  let courseId = courseInfo.course_id;
  let {
    chapter: { chapter_id },
    section: { section_id },
  } = await getContentInfo(content_id);
  const { section_name } = courseInfo.chapter_list
    .find((item) => item.chapter_id == chapter_id)
    ?.section_list.find((item) => item.section_id == section_id);
  let { result: pointList } = await getPointList(userId, courseId);
  console.log("打卡点列表和节名称", pointList, section_name);
  const pointId = pointList.find((item) => trim(section_name) == trim(item.name))?.pointId;
  if (!pointId) {
    console.log("非打卡课程");
    return;
  }
  let res = await getTaskId(userId, pointId);
  taskId = res[0].taskId;
  let tips = insertTips(
    "kkb_tool",
    "position: fixed; left: 0; top: 65px; z-index: 9999; background: rgba(0,0,0,0.5);color: white; padding: 10px; margin: 10px;"
  );
  let videoTips = insertTips(
    "kkb_video",
    "position: fixed; right: 0; top: 65px; z-index: 9999; background: rgba(0,0,0,0.5);color: white; padding: 10px; margin: 10px;"
  );
  let video = document.querySelector("video");
  let t1 = setInterval(() => {
    if (video) {
      clearInterval(t1);
      // video.addEventListener("loadeddata", () => {
      setInterval(() => {
        const currentTime = formatTime(video.currentTime);
        const left = formatTime(video.duration - video.currentTime);
        videoTips.innerHTML = `${currentTime} / ${left}`;
      }, 500);
      // });
    } else {
      video = document.querySelector("video");
    }
  }, 1000);
  t = setInterval(updateProgress, 60 * 1000, userId, taskId, tips);
  updateProgress(userId, taskId, tips);
});
function trim(str) {
  return encodeURI(str).replaceAll('%C2%A0','').replaceAll('%20','')
}
function formatTime(seconds) {
  return `${parseInt(seconds / 60 / 60)}:${addZero(
    parseInt((seconds / 60) % 60)
  )}:${addZero(parseInt(seconds % 60))}`;
}
function addZero(num) {
  return num > 9 ? num : "0" + num;
}
function insertTips(id, style) {
  let div = document.createElement("div");
  div.id = id;
  div.style.cssText = style;
  document.body.appendChild(div);
  return div;
}
async function getContentInfo(content_id) {
  // return document.querySelector('.title-catalogue').innerText;
  const { location } = await request(
    `https://weblearn.kaikeba.com/student/course/content?content_id=${content_id}`
  );
  return location;
}
async function updateProgress(userId, taskId, tips) {
  let progress = await getProgress(userId, taskId);
  if (progress[0] == "已完成") {
    console.log("本课已完成");
    tips.innerHTML = "已完成";
    clearInterval(t);
  } else {
    tips.innerHTML = progress.map((item) => `<p>${item}</p>`).join("");
  }
}
async function getProgress(userId, taskId) {
  const res = await request(
    `${hostPrefix}/task-result?userId=${userId}&taskId=${taskId}`
  );
  return res.split("；");
}
async function getPointList(userId, courseId) {
  let pageSize = 100,
    pageNum = 1;
  return await request(
    `${hostPrefix}/point-list?courseId=${courseId}&pageSize=${pageSize}&userId=${userId}&pageNum=${pageNum}`
  );
}
async function getTaskId(userId, pointId) {
  return await request(
    `${hostPrefix}/task-list?pointId=${pointId}&userId=${userId}`
  );
}
async function request(url, method = "get") {
  let cookie = document.cookie
    .split("; ")
    .find((item) => !item.indexOf("access-edu_online"))
    .split("=")[1];
  return await fetch(url, {
    headers: {
      authorization: "Bearer pc:" + cookie,
    },
  })
    .then((res) => res.json())
    .then((res) => res.data);
}
