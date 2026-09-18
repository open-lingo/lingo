/**
 * The 2,136-character official Jōyō kanji list (2010 reform, MEXT
 * "Jōyō Kanji Hyō" / 常用漢字表), used by the KANJICAT lane (2026-09-18) to
 * decide which uncatalogued live-course characters belong in `N5_KANJI`
 * (Jōyō → catalogue it) vs. the coverage gate's allow-list (non-Jōyō →
 * stays kana forever by design; see `kanjiCatalogCoverage.test.ts`'s
 * `ALLOWED_UNCATALOGUED_CHARS`).
 *
 * SOURCE: derived from KANJIDIC2 (EDRDG, CC BY-SA 4.0 —
 * <http://www.edrdg.org/wiki/index.php/KANJIDIC_Project>, fetched
 * 2026-09-18 from <http://www.edrdg.org/kanjidic/kanjidic2.xml.gz>) by
 * selecting every character whose `<grade>` field is 1–8. KANJIDIC2's own
 * grade convention (documented in its DTD comments): 1–6 = taught in
 * Japanese elementary school (教育漢字 / kyōiku kanji), 8 = the remaining
 * Jōyō characters taught in secondary school, 9 = jinmeiyō (name-only)
 * kanji, 10 = jinmeiyō variant forms — 9/10 are deliberately excluded here.
 * Grades 1–8 sum to exactly 2,136, the well-documented size of the
 * post-2010 Jōyō list, which is the cross-check that this selection rule
 * is correct and not merely plausible. See THIRD_PARTY_LICENSES.md for the
 * full citation.
 *
 * Not committed as a lookup JSON deliberately — a plain string constant is
 * enough for `.has()` and needs no build step or asset pipeline entry.
 */
const JOYO_KANJI_STR =
  "亜哀愛挨悪握圧扱宛安暗案闇以位依偉囲委威" +
  "尉意慰易椅為畏異移維緯胃萎衣違遺医井域育" +
  "一壱逸稲茨芋印咽員因姻引飲淫院陰隠韻右宇" +
  "羽雨臼渦唄浦運雲餌営影映栄永泳英衛詠鋭液" +
  "疫益駅悦謁越閲円園宴延怨援沿演炎煙猿縁艶" +
  "遠鉛塩汚凹央奥往応押旺横欧殴王翁黄岡沖億" +
  "屋憶臆乙俺卸恩温穏音下化仮何価佳加可夏嫁" +
  "家寡科暇果架歌河火禍稼箇花苛荷華菓課貨過" +
  "蚊我牙画芽賀雅餓介会解回塊壊快怪悔懐戒拐" +
  "改械海灰界皆絵開階貝劾外害崖慨概涯蓋街該" +
  "骸垣柿嚇各拡格核殻獲確穫覚角較郭閣隔革学" +
  "岳楽額顎掛潟割喝括活渇滑葛褐轄且株釜鎌刈" +
  "瓦乾冠寒刊勘勧巻喚堪完官寛干幹患感慣憾換" +
  "敢棺款歓汗漢環甘監看管簡緩缶肝艦観貫還鑑" +
  "間閑関陥韓館丸含岸玩眼岩頑顔願企伎危喜器" +
  "基奇寄岐希幾忌揮机旗既期棋棄機帰気汽畿祈" +
  "季紀規記貴起軌輝飢騎鬼亀偽儀宜戯技擬欺犠" +
  "疑義議菊吉喫詰却客脚虐逆丘久休及吸宮弓急" +
  "救朽求泣球究窮級糾給旧牛去居巨拒拠挙虚許" +
  "距漁魚享京供競共凶協叫境峡強恐恭挟教橋況" +
  "狂狭矯胸脅興郷鏡響驚仰凝暁業局曲極玉僅勤" +
  "均巾錦斤琴禁筋緊菌襟謹近金吟銀九句区苦駆" +
  "駒具愚虞空偶遇隅串屈掘窟靴熊繰桑勲君薫訓" +
  "群軍郡係傾刑兄啓型契形径恵慶憩掲携敬景渓" +
  "稽系経継茎蛍計詣警軽鶏芸迎鯨劇撃激隙桁傑" +
  "欠決潔穴結血月件倹健兼券剣圏堅嫌建憲懸拳" +
  "検権犬献研絹県肩見謙賢軒遣鍵険顕験元原厳" +
  "幻弦減源玄現舷言限個古呼固孤己庫弧戸故枯" +
  "湖股虎誇雇顧鼓五互午呉娯後御悟碁語誤護乞" +
  "交侯候光公功効勾厚口向后喉坑好孔孝工巧幸" +
  "広康恒慌抗拘控攻更校梗構江洪港溝甲皇硬稿" +
  "紅絞綱耕考肯航荒行衡講貢購郊酵鉱鋼降項香" +
  "高剛号合拷豪克刻告国穀酷黒獄腰骨込頃今困" +
  "墾婚恨懇昆根混痕紺魂佐唆左差査沙砂詐鎖座" +
  "挫債催再最塞妻宰彩才採栽歳済災采砕祭斎細" +
  "菜裁載際剤在材罪財坂阪咲崎埼作削搾昨柵策" +
  "索錯桜冊刷察拶撮擦札殺雑皿三傘参山惨散桟" +
  "産算蚕賛酸斬暫残仕伺使刺司史嗣四士始姉姿" +
  "子市師志思指支施旨枝止死氏祉私糸紙紫肢脂" +
  "至視詞詩試誌諮資賜雌飼歯事似侍児字寺慈持" +
  "時次滋治璽磁示耳自辞鹿式識軸七執失嫉室湿" +
  "漆疾質実芝舎写射捨赦斜煮社者謝車遮蛇邪借" +
  "尺爵酌釈若寂弱主取守手朱殊狩珠種腫趣酒首" +
  "儒受呪寿授樹需囚収周宗就州修愁拾秀秋終習" +
  "臭舟衆襲蹴週酬集醜住充十従柔汁渋獣縦重銃" +
  "叔宿淑祝縮粛塾熟出術述俊春瞬准循旬殉準潤" +
  "盾純巡遵順処初所暑庶緒署書諸助叙女序徐除" +
  "傷償勝匠升召商唱奨宵将小少尚床彰承抄招掌" +
  "昇昭晶松沼消渉焼焦照症省硝礁祥称章笑粧紹" +
  "肖衝訟証詔詳象賞鐘障上丈乗冗剰城場壌嬢常" +
  "情条浄状畳蒸譲醸錠嘱飾拭植殖織職色触食辱" +
  "尻伸信侵唇娠寝審心慎振新森浸深申真神紳臣" +
  "芯薪親診身辛進針震人仁刃尋甚尽腎迅陣須酢" +
  "図吹垂帥推水炊睡粋衰遂酔随髄崇数枢据杉裾" +
  "澄寸世瀬畝是凄制勢姓征性成政整星晴正清牲" +
  "生盛精聖声製西誠誓請逝醒青静斉税隻席惜戚" +
  "斥昔析石積籍績脊責赤跡切拙接摂折設窃節説" +
  "雪絶舌仙先千占宣専川戦扇栓泉浅洗染潜煎旋" +
  "線繊羨腺船薦詮践選遷銭鮮前善漸然全禅繕膳" +
  "塑措曽狙疎礎祖租粗素組訴阻遡僧創双倉喪壮" +
  "奏爽層想捜掃挿操早曹巣槽燥争痩相窓総草荘" +
  "葬藻装走送遭霜騒像増憎臓蔵贈造促側則即息" +
  "捉束測足速俗属賊族続卒袖存孫尊損村遜他多" +
  "太汰唾堕妥惰打駄体堆対耐帯待怠態戴替泰滞" +
  "胎袋貸退逮隊代台大第題滝卓宅択拓沢濯託濁" +
  "諾但達奪脱棚谷誰丹単嘆担探旦淡炭短端綻胆" +
  "誕鍛団壇弾断暖段男談値知地恥池痴稚置致遅" +
  "築畜竹蓄逐秩窒茶嫡着中仲宙忠抽昼柱注虫衷" +
  "酎鋳駐著貯丁兆帳庁弔張彫徴懲挑朝潮町眺聴" +
  "腸調超跳長頂鳥勅捗直朕沈珍賃鎮陳津墜椎追" +
  "痛通塚漬潰坪爪釣鶴亭低停偵貞呈堤定帝底庭" +
  "廷弟抵提程締艇訂諦逓邸泥摘敵滴的笛適溺哲" +
  "徹撤迭鉄典天展店添貼転点伝殿田電吐塗妬徒" +
  "斗渡登賭途都努度土奴怒倒党冬凍刀唐塔島悼" +
  "投搭東桃棟盗湯灯当痘等答筒糖統到藤討謄豆" +
  "踏逃透陶頭騰闘働動同堂導憧洞瞳童胴道銅峠" +
  "匿得徳特督篤毒独読栃凸突届屯豚頓曇鈍奈那" +
  "内謎鍋縄南軟難二尼弐匂肉虹日乳入如尿任妊" +
  "忍認寧猫熱年念捻燃粘悩濃納能脳農把覇波派" +
  "破婆罵馬俳廃拝排敗杯背肺輩配倍培媒梅買売" +
  "賠陪伯博拍泊白舶薄迫漠爆縛麦箱箸肌畑八鉢" +
  "発髪伐罰抜閥伴判半反帆搬斑板氾汎版犯班畔" +
  "繁般藩販範煩頒飯晩番盤蛮卑否妃彼悲扉批披" +
  "比泌疲皮碑秘罷肥被費避非飛備尾微眉美鼻匹" +
  "膝肘必筆姫媛百俵標氷漂票表評描病秒苗品浜" +
  "貧賓頻敏瓶不付夫婦富布府怖扶敷普浮父符腐" +
  "膚譜負賦赴阜附侮武舞部封風伏副復幅服福腹" +
  "複覆払沸仏物分噴墳憤奮粉紛雰文聞丙併兵塀" +
  "幣平弊柄並蔽閉陛米壁癖別蔑偏変片編辺返遍" +
  "便勉弁保舗捕歩補穂募墓慕暮母簿倣俸包報奉" +
  "宝峰崩抱放方法泡砲縫胞芳蜂褒訪豊邦飽乏亡" +
  "傍剖坊妨帽忘忙房暴望某棒冒紡肪膨謀貌貿防" +
  "北僕墨撲朴牧睦勃没堀奔本翻凡盆摩磨魔麻埋" +
  "妹昧枚毎幕膜枕又抹末繭万慢満漫味未魅岬密" +
  "蜜脈妙民眠務夢無矛霧婿娘冥名命明盟迷銘鳴" +
  "滅免綿面麺模茂妄毛猛盲網耗木黙目餅戻問紋" +
  "門冶夜野弥矢厄役約薬訳躍柳愉油癒諭輸唯優" +
  "勇友幽悠憂有湧猶由裕誘遊郵雄融夕予余与誉" +
  "預幼妖容庸揚揺擁曜様洋溶用窯羊葉要謡踊陽" +
  "養抑欲沃浴翌翼羅裸来頼雷絡落酪乱卵嵐欄濫" +
  "藍覧利吏履梨理璃痢裏里離陸律率立略流留硫" +
  "粒隆竜侶慮旅虜了僚両寮料涼猟療瞭糧良量陵" +
  "領力緑倫厘林臨輪隣瑠塁涙累類令例冷励礼鈴" +
  "隷零霊麗齢暦歴列劣烈裂廉恋練連錬呂炉賂路" +
  "露労廊弄朗楼浪漏老郎六麓録論和話賄脇惑枠" +
  "湾腕丼傲刹哺喩嗅嘲毀彙恣惧慄憬拉摯曖楷鬱" +
  "璧瘍箋籠緻羞訃諧貪踪辣錮塡頰𠮟剝";

/** Every distinct Han character in the list, as a `Set` for O(1) lookup.
 *  Built via `for...of` (not `.split("")`) so the one non-BMP character
 *  (𠮟, U+20B9F, a JIS X 0213 Jōyō addition) survives as a single element
 *  rather than being torn into two UTF-16 surrogate halves. */
export const JOYO_KANJI: ReadonlySet<string> = new Set([...JOYO_KANJI_STR]);

export function isJoyoKanji(char: string): boolean {
  return JOYO_KANJI.has(char);
}
