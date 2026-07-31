/**
 * Korean curated content — stories + conversations.
 *
 * CONVERSATIONS m3-m27 are converted verbatim from the per-module
 * "Mini-dialogue" lessons (`languages/ko/curriculum/m*.ts`): the exchange
 * that lived as an `infoStep` script is lifted into structured `lines` split
 * by speaker, each with its translation. They are already module-calibrated,
 * so they pass the comprehensibility gate at their module by construction.
 *
 * STORIES + the richer CONVERSATIONS below are newly authored for early-mid
 * modules using only in-module vocab (gate-verified).
 *
 * Readings (Revised Romanization) are derived at first access via
 * `romanizeKorean`, so authored data stays terse and the reading aid stays
 * consistent with the rest of the KO surfaces.
 */
import { romanizeKorean } from "@/features/languages/ko/romanization/hangulRomanize";
import type { Conversation, Story } from "./types";

const YOU = "You";

// ── Converted mini-dialogues (m3-m27) ───────────────────────────────────────
const CONVERSATIONS_RAW: Conversation[] = [
  {
    id: "ko-m3-meeting",
    languageId: "ko",
    module: 3,
    title: "Meeting someone",
    situation: "A first meeting — greet, introduce yourself, ask a name.",
    speakers: [
      { id: "A", label: "Minsu" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "안녕하세요! 저는 민수예요.", translation: "Hello! I'm Minsu." },
      { speaker: "B", text: "안녕하세요. 이름이 뭐예요?", translation: "Hello. What's your name?" },
      { speaker: "A", text: "반갑습니다!", translation: "Nice to meet you!" },
    ],
  },
  {
    id: "ko-m4-shop-pointing",
    languageId: "ko",
    module: 4,
    title: "At a shop",
    situation: "Point at things, ask what they are and whose they are.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Shopkeeper" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "이게 뭐예요?", translation: "What is this?" },
      { speaker: "B", text: "그거 가방이에요.", translation: "That's a bag." },
      { speaker: "A", text: "저거는 누구 거예요?", translation: "Whose is that one over there?" },
      { speaker: "B", text: "제 거예요.", translation: "It's mine." },
    ],
  },
  {
    id: "ko-m5-cafe",
    languageId: "ko",
    module: 5,
    title: "At a cafe",
    situation: "Order, ask the price, and count — all together.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Staff" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "커피 두 잔 주세요.", translation: "Two coffees, please." },
      { speaker: "B", text: "네.", translation: "Sure." },
      { speaker: "A", text: "이거 얼마예요?", translation: "How much is this?" },
      { speaker: "B", text: "사천 원이에요.", translation: "It's 4,000 won." },
    ],
  },
  {
    id: "ko-m6-finding-way",
    languageId: "ko",
    module: 6,
    title: "Finding your way",
    situation: "Ask where a place is and say where you are.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Passer-by" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "식당이 어디에 있어요?", translation: "Where's the restaurant?" },
      { speaker: "B", text: "역에 있어요.", translation: "It's at the station." },
      { speaker: "A", text: "친구가 학교에 있어요.", translation: "My friend is at school." },
    ],
  },
  {
    id: "ko-m7-what-doing",
    languageId: "ko",
    module: 7,
    title: "What are you doing?",
    situation: "Ask and answer about everyday actions.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "뭐 해요?", translation: "What are you doing?" },
      { speaker: "B", text: "영화를 봐요.", translation: "I'm watching a movie." },
      { speaker: "A", text: "저는 공부해요.", translation: "I'm studying." },
    ],
  },
  {
    id: "ko-m8-shop-reacting",
    languageId: "ko",
    module: 8,
    title: "Reacting in a shop",
    situation: "React to things you see and try.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "이 가방 예뻐요?", translation: "Is this bag pretty?" },
      { speaker: "B", text: "예뻐요! 비싸요.", translation: "It's pretty! It's expensive." },
      { speaker: "A", text: "이 책은 좋아요.", translation: "This book is good." },
    ],
  },
  {
    id: "ko-m9-ordering-together",
    languageId: "ko",
    module: 9,
    title: "Ordering together",
    situation: "Order for two and say 'me too'.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "커피하고 빵 주세요.", translation: "Coffee and bread, please." },
      { speaker: "B", text: "저도 커피 주세요.", translation: "Coffee for me too, please." },
      { speaker: "A", text: "친구하고 가요.", translation: "I'm going with a friend." },
    ],
  },
  {
    id: "ko-m10-how-was-it",
    languageId: "ko",
    module: 10,
    title: "How was it?",
    situation: "Ask about the past and react.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "어제 뭐 했어요?", translation: "What did you do yesterday?" },
      { speaker: "B", text: "영화를 봤어요. 좋았어요.", translation: "I watched a movie. It was good." },
      { speaker: "A", text: "저는 친구하고 밥을 먹었어요.", translation: "I ate with a friend." },
    ],
  },
  {
    id: "ko-m11-declining",
    languageId: "ko",
    module: 11,
    title: "Declining politely",
    situation: "Turn something down and say what you'd rather do.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "커피 마셔요?", translation: "Are you drinking coffee?" },
      { speaker: "B", text: "아니요, 커피 안 마셔요.", translation: "No, I don't drink coffee." },
      { speaker: "A", text: "영화 보고 싶어요?", translation: "Do you want to watch a movie?" },
      { speaker: "B", text: "오늘은 못 봐요.", translation: "I can't today." },
    ],
  },
  {
    id: "ko-m12-making-plans",
    languageId: "ko",
    module: 12,
    title: "Making plans",
    situation: "Ask the time, pick a day, make a plan.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Friend" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "지금 몇 시예요?", translation: "What time is it now?" },
      { speaker: "B", text: "두 시예요.", translation: "It's 2 o'clock." },
      { speaker: "A", text: "금요일에 영화를 보고 싶어요.", translation: "I want to watch a movie on Friday." },
      { speaker: "B", text: "좋아요! 세 시에 만나요.", translation: "Great! Let's meet at 3:00." },
    ],
  },
  {
    id: "ko-m13-routine",
    languageId: "ko",
    module: 13,
    title: "Your routine",
    situation: "Ask and answer about how often and when.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "자주 운동해요?", translation: "Do you exercise often?" },
      { speaker: "B", text: "아니요, 가끔 해요.", translation: "No, sometimes." },
      { speaker: "A", text: "언제 공부해요?", translation: "When do you study?" },
      { speaker: "B", text: "한 시부터 세 시까지 공부해요.", translation: "From 1:00 to 3:00." },
    ],
  },
  {
    id: "ko-m14-asking-help",
    languageId: "ko",
    module: 14,
    title: "Asking for help",
    situation: "Link actions, give a reason, make a request.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Colleague" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "도와주세요.", translation: "Please help me." },
      { speaker: "B", text: "네, 뭐예요?", translation: "Sure, what is it?" },
      { speaker: "A", text: "바빠서 시간이 없어요.", translation: "I'm busy, so I have no time." },
      { speaker: "B", text: "기다려 주세요.", translation: "Please wait." },
    ],
  },
  {
    id: "ko-m15-cafe-permission",
    languageId: "ko",
    module: 15,
    title: "At the cafe",
    situation: "Ask what someone's doing and ask permission.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Friend" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "뭐 하고 있어요?", translation: "What are you doing?" },
      { speaker: "B", text: "커피를 마시고 있어요.", translation: "I'm drinking coffee." },
      { speaker: "A", text: "여기 앉아도 돼요?", translation: "May I sit here?" },
      { speaker: "B", text: "네, 돼요.", translation: "Yes, you may." },
    ],
  },
  {
    id: "ko-m16-house-rules",
    languageId: "ko",
    module: 16,
    title: "House rules",
    situation: "State a rule, make a request, share a preference.",
    speakers: [
      { id: "A", label: "Host" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "여기서 담배를 피우면 안 돼요.", translation: "You can't smoke here." },
      { speaker: "B", text: "네, 알겠어요.", translation: "OK, got it." },
      { speaker: "A", text: "여기 앉아도 돼요.", translation: "You may sit here." },
      { speaker: "B", text: "저는 이 집을 좋아해요.", translation: "I like this house." },
    ],
  },
  {
    id: "ko-m17-asking-way",
    languageId: "ko",
    module: 17,
    title: "Asking the way",
    situation: "Ask how to get somewhere and follow directions.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Passer-by" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "역까지 어떻게 가요?", translation: "How do I get to the station?" },
      { speaker: "B", text: "버스를 타세요.", translation: "Take the bus." },
      { speaker: "A", text: "어디서 내려요?", translation: "Where do I get off?" },
      { speaker: "B", text: "다음 역에서 내려서 왼쪽으로 가세요.", translation: "Get off at the next stop and go left." },
    ],
  },
  {
    id: "ko-m18-weather",
    languageId: "ko",
    module: 18,
    title: "The weather",
    situation: "Ask about the weather and make plans around it.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "오늘 날씨 좋아요?", translation: "Is the weather good today?" },
      { speaker: "B", text: "흐려요. 비가 올 것 같아요.", translation: "It's cloudy. Looks like it'll rain." },
      { speaker: "A", text: "그래서 집에 있을 거예요.", translation: "So I'll stay home." },
      { speaker: "B", text: "내일은 맑을 거예요.", translation: "Tomorrow will be clear." },
    ],
  },
  {
    id: "ko-m19-family",
    languageId: "ko",
    module: 19,
    title: "Talking about family",
    situation: "Ask and answer about each other's families.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "가족이 몇 명이에요?", translation: "How many in your family?" },
      { speaker: "B", text: "네 명이에요. 엄마, 아빠, 형, 그리고 저요.", translation: "Four. Mom, dad, my older brother, and me." },
      { speaker: "A", text: "형은 몇 살이에요?", translation: "How old is your brother?" },
      { speaker: "B", text: "스무 살이에요.", translation: "He's twenty." },
    ],
  },
  {
    id: "ko-m20-doctor",
    languageId: "ko",
    module: 20,
    title: "At the doctor's",
    situation: "Describe your symptoms and get advice.",
    speakers: [
      { id: "A", label: "Doctor" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "어디가 아파요?", translation: "Where does it hurt?" },
      { speaker: "B", text: "머리가 아파요. 그리고 열이 나요.", translation: "My head hurts. And I have a fever." },
      { speaker: "A", text: "감기예요. 약을 먹으면 괜찮을 거예요.", translation: "It's a cold. If you take medicine, you'll be fine." },
    ],
  },
  {
    id: "ko-m21-restaurant",
    languageId: "ko",
    module: 21,
    title: "At a restaurant",
    situation: "Order a meal and a drink.",
    speakers: [
      { id: "A", label: "Staff" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "뭐 드릴까요?", translation: "What can I get you?" },
      { speaker: "B", text: "비빔밥하고 커피 한 잔 주세요.", translation: "Bibimbap and one coffee, please." },
      { speaker: "A", text: "이거는 김치라고 해요. 드셔 보세요.", translation: "This is called kimchi. Please try it." },
      { speaker: "B", text: "감사합니다.", translation: "Thank you." },
    ],
  },
  {
    id: "ko-m22-which-better",
    languageId: "ko",
    module: 22,
    title: "Which is better?",
    situation: "Help a friend choose between two options.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "커피하고 차 중에서 뭐가 더 좋아요?", translation: "Between coffee and tea, which is better?" },
      { speaker: "B", text: "저는 커피가 더 좋아요.", translation: "I like coffee more." },
      { speaker: "A", text: "여기는 차가 커피보다 싸요.", translation: "Here, tea is cheaper than coffee." },
      { speaker: "B", text: "그래도 커피가 제일 맛있어요.", translation: "Still, coffee is the tastiest." },
    ],
  },
  {
    id: "ko-m23-lets-do",
    languageId: "ko",
    module: 23,
    title: "Let's do something",
    situation: "Suggest an activity with a friend.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "주말에 뭐 할까요?", translation: "What shall we do on the weekend?" },
      { speaker: "B", text: "저는 요리를 잘해요. 같이 요리할까요?", translation: "I'm good at cooking. Shall we cook together?" },
      { speaker: "A", text: "좋아요! 같이 합시다.", translation: "Great! Let's do it." },
    ],
  },
  {
    id: "ko-m24-hobbies",
    languageId: "ko",
    module: 24,
    title: "Talking about hobbies",
    situation: "Ask and answer about each other's hobbies.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "취미가 뭐예요?", translation: "What's your hobby?" },
      { speaker: "B", text: "저는 음악을 들어요. 노래도 할 줄 알아요.", translation: "I listen to music. I also know how to sing." },
      { speaker: "A", text: "일주일에 몇 번 노래해요?", translation: "How many times a week do you sing?" },
      { speaker: "B", text: "두 번 해요. 같이 할까요?", translation: "Twice. Shall we do it together?" },
    ],
  },
  {
    id: "ko-m25-trip",
    languageId: "ko",
    module: 25,
    title: "Planning a trip",
    situation: "Combine intentions, purpose, and experience.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "여행 계획이 있어요?", translation: "Do you have travel plans?" },
      { speaker: "B", text: "네, 일본에 가려고 해요.", translation: "Yes, I intend to go to Japan." },
      { speaker: "A", text: "일본에 간 적이 있어요?", translation: "Have you been to Japan?" },
      { speaker: "B", text: "아니요. 온천에 가고 싶어요.", translation: "No. I want to go to a hot spring." },
    ],
  },
  {
    id: "ko-m26-why-late",
    languageId: "ko",
    module: 26,
    title: "Why are you late?",
    situation: "Apologize and explain a reason.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "왜 늦었어요?", translation: "Why are you late?" },
      { speaker: "B", text: "죄송해요. 길이 너무 막혔거든요.", translation: "Sorry. The road was too jammed, you see." },
      { speaker: "A", text: "괜찮아요. 피곤해요?", translation: "It's OK. Are you tired?" },
      { speaker: "B", text: "네, 너무 피곤해서 집에 가고 싶어요.", translation: "Yes, I'm so tired I want to go home." },
    ],
  },
  {
    id: "ko-m27-advice",
    languageId: "ko",
    module: 27,
    title: "Giving advice",
    situation: "Combine must, should, and become.",
    speakers: [
      { id: "A", label: "Friend" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "너무 피곤해요.", translation: "I'm so tired." },
      { speaker: "B", text: "약을 먹는 게 좋아요.", translation: "You should take medicine." },
      { speaker: "A", text: "네. 병원에 가야 돼요?", translation: "Yes. Do I have to go to the hospital?" },
      { speaker: "B", text: "쉬면 건강해져요. 조심하세요.", translation: "If you rest, you'll get healthy. Take care." },
    ],
  },
];

// ── Newly authored richer conversations ─────────────────────────────────────
const AUTHORED_CONVERSATIONS: Conversation[] = [
  {
    id: "ko-m5-cafe-busy",
    languageId: "ko",
    module: 5,
    title: "A busy cafe",
    situation: "Order for two, check a price, and count carefully.",
    speakers: [
      { id: "A", label: YOU },
      { id: "B", label: "Barista" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "커피 세 잔 주세요.", translation: "Three coffees, please." },
      { speaker: "B", text: "네. 물도 주세요?", translation: "Sure. Water too?" },
      { speaker: "A", text: "네, 물 한 잔 주세요.", translation: "Yes, one glass of water, please." },
      { speaker: "B", text: "삼천 원이에요.", translation: "It's 3,000 won." },
      { speaker: "A", text: "네, 감사합니다.", translation: "OK, thank you." },
    ],
  },
  {
    id: "ko-m7-roommates",
    languageId: "ko",
    module: 7,
    title: "Roommates at home",
    situation: "Two roommates check in on what each other is doing.",
    speakers: [
      { id: "A", label: "Jun" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "뭐 해요?", translation: "What are you doing?" },
      { speaker: "B", text: "밥을 먹어요. 준도 먹어요?", translation: "I'm eating. Are you eating too, Jun?" },
      { speaker: "A", text: "아니요, 저는 공부해요.", translation: "No, I'm studying." },
      { speaker: "B", text: "저는 영화를 봐요.", translation: "I'm watching a movie." },
    ],
  },
  {
    id: "ko-m10-catchup",
    languageId: "ko",
    module: 10,
    title: "How was yesterday?",
    situation: "Catch up on what you each did yesterday.",
    speakers: [
      { id: "A", label: "Mina" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "어제 뭐 했어요?", translation: "What did you do yesterday?" },
      { speaker: "B", text: "친구하고 커피를 마셨어요.", translation: "I had coffee with a friend." },
      { speaker: "A", text: "저는 집에서 영화를 봤어요. 좋았어요.", translation: "I watched a movie at home. It was good." },
      { speaker: "B", text: "저도 영화를 봤어요.", translation: "I watched a movie too." },
    ],
  },
  {
    id: "ko-m13-gym-buddy",
    languageId: "ko",
    module: 13,
    title: "Gym schedules",
    situation: "Compare when and how often you each exercise.",
    speakers: [
      { id: "A", label: "Jisu" },
      { id: "B", label: YOU },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "자주 운동해요?", translation: "Do you exercise often?" },
      { speaker: "B", text: "네, 자주 해요. 언제 운동해요?", translation: "Yes, often. When do you exercise?" },
      { speaker: "A", text: "저는 한 시에 해요.", translation: "I do it at 1 o'clock." },
      { speaker: "B", text: "저는 한 시부터 두 시까지 해요.", translation: "I do it from 1:00 to 2:00." },
    ],
  },
];

// ── Newly authored stories (m3-m12) ─────────────────────────────────────────
const STORIES_RAW: Story[] = [
  {
    id: "ko-m3-new-friend",
    languageId: "ko",
    module: 3,
    title: "A new classmate",
    theme: "Introducing yourself on the first day.",
    sentences: [
      { text: "안녕하세요.", translation: "Hello." },
      { text: "저는 학생이에요.", translation: "I'm a student." },
      { text: "이름이 민수예요.", translation: "My name is Minsu." },
      { text: "친구도 학생이에요.", translation: "My friend is a student too." },
      { text: "반갑습니다.", translation: "Nice to meet you." },
    ],
  },
  {
    id: "ko-m4-whose-bag",
    languageId: "ko",
    module: 4,
    title: "Whose bag?",
    theme: "Sorting out what belongs to whom.",
    sentences: [
      { text: "이게 뭐예요?", translation: "What is this?" },
      { text: "가방이에요.", translation: "It's a bag." },
      { text: "이 가방은 제 거예요.", translation: "This bag is mine." },
      { text: "저 책은 친구 거예요.", translation: "That book is my friend's." },
      { text: "그거는 누구 거예요?", translation: "Whose is that one?" },
    ],
  },
  {
    id: "ko-m5-cafe-morning",
    languageId: "ko",
    module: 5,
    title: "Morning at the cafe",
    theme: "A quick coffee run.",
    sentences: [
      { text: "커피 두 잔 주세요.", translation: "Two coffees, please." },
      { text: "물도 한 잔 주세요.", translation: "One water too, please." },
      { text: "이거 얼마예요?", translation: "How much is this?" },
      { text: "사천 원이에요.", translation: "It's 4,000 won." },
      { text: "감사합니다.", translation: "Thank you." },
    ],
  },
  {
    id: "ko-m6-lost-friend",
    languageId: "ko",
    module: 6,
    title: "Where is everyone?",
    theme: "Finding your friends around town.",
    sentences: [
      { text: "친구가 어디에 있어요?", translation: "Where is my friend?" },
      { text: "학교에 있어요.", translation: "They're at school." },
      { text: "선생님은 식당에 있어요.", translation: "The teacher is at the restaurant." },
      { text: "저는 역에 있어요.", translation: "I'm at the station." },
      { text: "친구도 역에 있어요.", translation: "My friend is at the station too." },
    ],
  },
  {
    id: "ko-m7-my-day",
    languageId: "ko",
    module: 7,
    title: "My afternoon",
    theme: "A simple run-through of an afternoon.",
    sentences: [
      { text: "저는 집에 있어요.", translation: "I'm at home." },
      { text: "밥을 먹어요.", translation: "I eat a meal." },
      { text: "커피를 마셔요.", translation: "I drink coffee." },
      { text: "영화를 봐요.", translation: "I watch a movie." },
      { text: "친구는 공부해요.", translation: "My friend studies." },
    ],
  },
  {
    id: "ko-m8-market-day",
    languageId: "ko",
    module: 8,
    title: "At the market",
    theme: "Browsing and reacting to what you see.",
    sentences: [
      { text: "이 가방은 예뻐요.", translation: "This bag is pretty." },
      { text: "그런데 비싸요.", translation: "But it's expensive." },
      { text: "저 책은 싸요.", translation: "That book is cheap." },
      { text: "이 책은 좋아요.", translation: "This book is good." },
      { text: "저는 이 책이 좋아요.", translation: "I like this book." },
    ],
  },
  {
    id: "ko-m10-yesterday",
    languageId: "ko",
    module: 10,
    title: "Yesterday",
    theme: "Looking back on a good day.",
    sentences: [
      { text: "어제 뭐 했어요?", translation: "What did I do yesterday?" },
      { text: "친구하고 커피를 마셨어요.", translation: "I drank coffee with a friend." },
      { text: "영화를 봤어요.", translation: "I watched a movie." },
      { text: "영화가 좋았어요.", translation: "The movie was good." },
      { text: "저는 집에서 밥을 먹었어요.", translation: "I ate at home." },
    ],
  },
  {
    id: "ko-m12-friday-plan",
    languageId: "ko",
    module: 12,
    title: "A plan for Friday",
    theme: "Setting a time and place to meet.",
    sentences: [
      { text: "금요일에 시간이 있어요.", translation: "I have time on Friday." },
      { text: "친구하고 영화를 보고 싶어요.", translation: "I want to watch a movie with a friend." },
      { text: "지금 몇 시예요?", translation: "What time is it now?" },
      { text: "두 시예요.", translation: "It's 2 o'clock." },
      { text: "세 시에 만나요.", translation: "Let's meet at 3:00." },
    ],
  },
  {
    id: "ko-m9-a-snack",
    languageId: "ko",
    module: 9,
    title: "A snack at home",
    theme: "Bread, milk, and an apple.",
    sentences: [
      { text: "저는 집에 있어요.", translation: "I'm at home." },
      { text: "빵하고 우유가 있어요.", translation: "There's bread and milk." },
      { text: "빵을 먹어요.", translation: "I eat the bread." },
      { text: "우유도 마셔요.", translation: "I drink the milk too." },
      { text: "빵하고 우유가 맛있어요.", translation: "The bread and milk are tasty." },
    ],
  },
  {
    id: "ko-m11-a-day-off",
    languageId: "ko",
    module: 11,
    title: "A day off",
    theme: "Staying in and wanting to relax.",
    sentences: [
      { text: "오늘은 학교에 안 가요.", translation: "Today I don't go to school." },
      { text: "저는 집에 있어요.", translation: "I stay at home." },
      { text: "영화를 보고 싶어요.", translation: "I want to watch a movie." },
      { text: "그런데 지금 커피가 없어요.", translation: "But there's no coffee right now." },
      { text: "커피를 못 마셔요.", translation: "I can't have my coffee." },
    ],
  },
  {
    id: "ko-m13-my-week",
    languageId: "ko",
    module: 13,
    title: "My week",
    theme: "Work, study, and a bit of exercise.",
    sentences: [
      { text: "저는 자주 운동해요.", translation: "I exercise often." },
      { text: "월요일부터 금요일까지 회사에 가요.", translation: "I go to work from Monday to Friday." },
      { text: "회사에서 공부해요.", translation: "I study at work." },
      { text: "저는 커피를 좋아해요.", translation: "I like coffee." },
      { text: "그리고 운동도 좋아해요.", translation: "And I like exercise too." },
      { text: "가끔 영화를 봐요.", translation: "Sometimes I watch a movie." },
    ],
  },
  {
    id: "ko-m14-a-busy-day",
    languageId: "ko",
    module: 14,
    title: "A busy day",
    theme: "Too much to do, too little time.",
    sentences: [
      { text: "저는 바빠서 시간이 없어요.", translation: "I'm busy, so I have no time." },
      { text: "오늘 회사에 가요.", translation: "I go to work today." },
      { text: "회사에서 공부해요.", translation: "I study at work." },
      { text: "친구가 와요.", translation: "A friend comes over." },
      { text: "친구하고 밥을 먹어요.", translation: "I eat with my friend." },
      { text: "저는 바빠서 커피를 못 마셔요.", translation: "I'm so busy I can't even drink coffee." },
    ],
  },
  {
    id: "ko-m15-relaxing-at-home",
    languageId: "ko",
    module: 15,
    title: "Relaxing at home",
    theme: "A quiet afternoon with a friend.",
    sentences: [
      { text: "오늘은 집에 있어요.", translation: "Today I'm at home." },
      { text: "커피를 마시고 있어요.", translation: "I'm drinking coffee." },
      { text: "영화를 보고 있어요.", translation: "I'm watching a movie." },
      { text: "친구가 전화해요.", translation: "A friend calls." },
      { text: "친구도 집에 와요.", translation: "My friend comes over too." },
      { text: "여기 앉아도 돼요.", translation: "You can sit here." },
    ],
  },
  {
    id: "ko-m16-friends-house",
    languageId: "ko",
    module: 16,
    title: "At a friend's house",
    theme: "Visiting a friend's place.",
    sentences: [
      { text: "오늘 친구 집에 가요.", translation: "Today I go to my friend's house." },
      { text: "친구 집에서는 담배를 피우면 안 돼요.", translation: "You can't smoke at my friend's house." },
      { text: "저는 담배를 싫어해요.", translation: "I don't like cigarettes." },
      { text: "네, 알겠어요.", translation: "OK, got it." },
      { text: "친구는 커피를 좋아해요.", translation: "My friend likes coffee." },
      { text: "저도 커피를 좋아해요.", translation: "I like coffee too." },
    ],
  },
  {
    id: "ko-m17-my-commute",
    languageId: "ko",
    module: 17,
    title: "My commute",
    theme: "Bus, subway, and a left turn.",
    sentences: [
      { text: "저는 회사에 가요.", translation: "I go to work." },
      { text: "버스를 타요.", translation: "I take the bus." },
      { text: "다음 역에서 내려요.", translation: "I get off at the next stop." },
      { text: "그리고 지하철을 타요.", translation: "And then I take the subway." },
      { text: "회사까지 똑바로 가요.", translation: "I go straight to the office." },
      { text: "왼쪽으로 가세요.", translation: "Go to the left." },
    ],
  },
  {
    id: "ko-m18-tomorrows-weather",
    languageId: "ko",
    module: 18,
    title: "Tomorrow's weather",
    theme: "A clear day, then rain.",
    sentences: [
      { text: "오늘은 날씨가 좋아요.", translation: "The weather is nice today." },
      { text: "맑아요.", translation: "It's clear." },
      { text: "그런데 내일은 비가 올 거예요.", translation: "But tomorrow it will rain." },
      { text: "내일은 추워요.", translation: "Tomorrow it's cold." },
      { text: "저는 겨울을 좋아해요.", translation: "I like winter." },
      { text: "겨울에는 눈이 와요.", translation: "In winter it snows." },
    ],
  },
  {
    id: "ko-m19-my-family",
    languageId: "ko",
    module: 19,
    title: "My family",
    theme: "Four of us, and an older brother.",
    sentences: [
      { text: "우리 가족은 네 명이에요.", translation: "There are four people in my family." },
      { text: "엄마, 아빠, 형, 그리고 저요.", translation: "Mom, dad, my older brother, and me." },
      { text: "형은 스무 살이에요.", translation: "My brother is twenty." },
      { text: "저는 학생이에요.", translation: "I'm a student." },
      { text: "형은 회사에 가요.", translation: "My brother goes to work." },
      { text: "우리 가족은 커피를 좋아해요.", translation: "My family likes coffee." },
    ],
  },
  {
    id: "ko-m20-a-cold",
    languageId: "ko",
    module: 20,
    title: "A cold",
    theme: "Aches, a fever, and some medicine.",
    sentences: [
      { text: "오늘은 머리가 아파요.", translation: "My head hurts today." },
      { text: "그리고 배도 아파요.", translation: "And my stomach hurts too." },
      { text: "감기예요.", translation: "It's a cold." },
      { text: "저는 병원에 가요.", translation: "I go to the hospital." },
      { text: "약을 먹어요.", translation: "I take medicine." },
      { text: "약을 먹으면 괜찮을 거예요.", translation: "If I take medicine, I'll be fine." },
    ],
  },
  {
    id: "ko-m21-a-korean-meal",
    languageId: "ko",
    module: 21,
    title: "A Korean meal",
    theme: "Bibimbap, bulgogi, and kimchi.",
    sentences: [
      { text: "저는 식당에 가요.", translation: "I go to a restaurant." },
      { text: "비빔밥하고 불고기를 먹어요.", translation: "I eat bibimbap and bulgogi." },
      { text: "김치도 맛있어요.", translation: "The kimchi is tasty too." },
      { text: "라면도 좋아해요.", translation: "I like ramen too." },
      { text: "친구는 생선하고 채소를 먹어요.", translation: "My friend eats fish and vegetables." },
      { text: "커피 한 잔 주세요.", translation: "One coffee, please." },
    ],
  },
  {
    id: "ko-m22-which-i-like-more",
    languageId: "ko",
    module: 22,
    title: "Which I like more",
    theme: "Comparing coffee and tea.",
    sentences: [
      { text: "저는 커피하고 차 중에서 커피가 더 좋아요.", translation: "Between coffee and tea, I like coffee more." },
      { text: "차는 커피보다 싸요.", translation: "Tea is cheaper than coffee." },
      { text: "그래도 커피가 제일 맛있어요.", translation: "Still, coffee is the tastiest." },
      { text: "친구는 차를 더 좋아해요.", translation: "My friend likes tea more." },
      { text: "뭐가 제일 좋아요?", translation: "What do you like best?" },
      { text: "커피가 가장 좋아요.", translation: "I like coffee best." },
    ],
  },
  {
    id: "ko-m23-weekend-plans",
    languageId: "ko",
    module: 23,
    title: "Weekend plans",
    theme: "Cooking and doing things together.",
    sentences: [
      { text: "주말에 뭐 할까요?", translation: "What shall we do on the weekend?" },
      { text: "저는 요리를 잘해요.", translation: "I'm good at cooking." },
      { text: "같이 요리할까요?", translation: "Shall we cook together?" },
      { text: "저는 수영도 잘해요.", translation: "I'm good at swimming too." },
      { text: "그런데 노래는 못해요.", translation: "But I can't sing." },
      { text: "주말에 같이 운동합시다.", translation: "Let's exercise together on the weekend." },
    ],
  },
  {
    id: "ko-m24-my-hobbies",
    languageId: "ko",
    module: 24,
    title: "My hobbies",
    theme: "Music, photos, and a bit of singing.",
    sentences: [
      { text: "제 취미는 음악이에요.", translation: "My hobby is music." },
      { text: "저는 음악을 자주 들어요.", translation: "I listen to music often." },
      { text: "사진도 좋아해요.", translation: "I like photography too." },
      { text: "노래도 할 줄 알아요.", translation: "I also know how to sing." },
      { text: "일주일에 두 번 게임을 해요.", translation: "I play games twice a week." },
      { text: "주말에 같이 할까요?", translation: "Shall we do it together on the weekend?" },
    ],
  },
  {
    id: "ko-m25-planning-a-trip",
    languageId: "ko",
    module: 25,
    title: "Planning a trip",
    theme: "A trip to Japan and a hot spring.",
    sentences: [
      { text: "저는 여행 계획이 있어요.", translation: "I have travel plans." },
      { text: "저는 일본에 가려고 해요.", translation: "I intend to go to Japan." },
      { text: "일본에 간 적이 있어요.", translation: "I've been to Japan before." },
      { text: "온천에 가고 싶어요.", translation: "I want to go to a hot spring." },
      { text: "축제도 보고 싶어요.", translation: "I want to see a festival too." },
      { text: "다음 주말에 출발해요.", translation: "I leave next weekend." },
    ],
  },
  {
    id: "ko-m26-a-rough-morning",
    languageId: "ko",
    module: 26,
    title: "A rough morning",
    theme: "Late, tired, and a traffic jam.",
    sentences: [
      { text: "오늘 회사에 늦었어요.", translation: "I was late for work today." },
      { text: "길이 너무 막혔거든요.", translation: "The road was really jammed, you see." },
      { text: "죄송해요.", translation: "I'm sorry." },
      { text: "저는 너무 피곤해요.", translation: "I'm so tired." },
      { text: "그리고 실수도 했어요.", translation: "And I made a mistake too." },
      { text: "저는 피곤해서 집에 가고 싶어요.", translation: "I'm tired, so I want to go home." },
    ],
  },
  {
    id: "ko-m27-before-the-exam",
    languageId: "ko",
    module: 27,
    title: "Before the exam",
    theme: "Getting ready, and taking care.",
    sentences: [
      { text: "내일은 시험이 있어요.", translation: "I have an exam tomorrow." },
      { text: "저는 시험 준비를 해요.", translation: "I'm getting ready for the exam." },
      { text: "오늘은 연습해요.", translation: "Today I practice." },
      { text: "저는 너무 피곤해요.", translation: "I'm so tired." },
      { text: "쉬면 건강해져요.", translation: "If I rest, I'll get healthy." },
      { text: "조심하세요.", translation: "Take care." },
    ],
  },
];

// ── Reading derivation + assembly ───────────────────────────────────────────
function withReading<T extends { text: string; reading?: string }>(line: T): T {
  return line.reading ? line : { ...line, reading: romanizeKorean(line.text) };
}

let storiesMemo: Story[] | null = null;
let conversationsMemo: Conversation[] | null = null;

export function koStories(): Story[] {
  if (!storiesMemo) {
    storiesMemo = STORIES_RAW.map((s) => ({
      ...s,
      sentences: s.sentences.map(withReading),
    }));
  }
  return storiesMemo;
}

export function koConversations(): Conversation[] {
  if (!conversationsMemo) {
    conversationsMemo = [...CONVERSATIONS_RAW, ...AUTHORED_CONVERSATIONS].map(
      (c) => ({ ...c, lines: c.lines.map(withReading) }),
    );
  }
  return conversationsMemo;
}
