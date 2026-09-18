/* 中国历史百科 · 数据核心
 * 全局结构：window.HISTORY_STAGES（数组，按时间顺序）
 * 每个阶段结构：
 * {
 *   id, name, range, era, emoji, color, tagline,
 *   summary,            // 概述（2~3 句）
 *   capital,            // 主要都城/区域（地理）
 *   stories:   [{title, text, img}]       // 重点故事（2~3 个，配图）
 *   inventions:[{title, text, icon}]      // 重大发明与成就（2~3 个）
 *   people:    [{name, text, img}]        // 重点人物（2~3 位，配图）
 *   chengyu:   [{idiom, pinyin, meaning, source, story}]  // 成语故事（2~3 个）
 *   mapSpots:  [{name, lng, lat, desc}]   // 地图点位
 *   quiz:      [{q, options[4], answer, explain}]  // 趣味问答（4 题）
 * }
 */
window.HISTORY_STAGES = [];
window.STAGE_BY_ID = {};
