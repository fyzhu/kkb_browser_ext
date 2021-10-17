let hostPrefix = "https://xiaoke.kaikeba.com/api/checkin/student";

document.addEventListener("DOMContentLoaded", async function () {
  //  courseId + userId => pointId list + userId=> taskId 38640734699419693 + userId => 进度
  // courseId 220931 catalog 页 => sectionId => content_id 483238 video页 => content_title => name => pointId => taskId
  let userId = localStorage.getItem("uid"),
    courseInfo = JSON.parse(localStorage.getItem("courseInfo")),
    pointId = "",
    taskId = "";
  let courseId = courseInfo.course_id;
  let content_id = location.href.split("/").pop();
  let { content_title: name } = await getName(content_id);
  let { result: pointList } = await getPointList(userId, courseId);
  pointId = pointList.find((item) => name.includes(item.name)).pointId;
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
  const video = document.querySelector("video");
  video.addEventListener("loadeddata", () => {
    setInterval(() => {
      const currentTime = formatTime(video.currentTime);
      const duration = formatTime(video.duration);
      videoTips.innerHTML = `${currentTime} / ${duration}`;
    }, 1000);
  });
  let t = setInterval(getProgress, 60 * 1000, userId, taskId, tips);
  let progress = await getProgress(userId, taskId, tips);
  if (progress[0] == "已完成") {
    console.log("本课已完成");
    tips.innerHTML = "已完成";
    clearInterval(t);
  } else {
    tips.innerHTML = progress.map((item) => `<p>${item}</p>`).join("");
  }
});
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
async function getName(content_id) {
  // return document.querySelector('.title-catalogue').innerText;
  return await request(
    `https://weblearn.kaikeba.com/student/course/content?content_id=${content_id}`
  );
}
async function getProgress(userId, taskId, tips) {
  let res = await request(
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
