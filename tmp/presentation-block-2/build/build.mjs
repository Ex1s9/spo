import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Presentation, PresentationFile } from '@oai/artifact-tool';
import { finalizePresentation, applyPresentationChartFont } from '/Users/sergey/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations/container_tools/artifact_tool_utils.mjs';

const ROOT='/Users/sergey/Desktop/spo 3';
const BUILD=path.join(ROOT,'tmp/presentation-block-2/build');
const OUT=path.join(ROOT,'output/defense-block-2');
const SKILL='/Users/sergey/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations';
const REFERENCE='/Users/sergey/Downloads/HH_Stack_Radar_prezentaciya-2.pdf';
const PYTHON='/Users/sergey/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const content=JSON.parse(await fs.readFile(path.join(BUILD,'content.json'),'utf8'));
const evidence=JSON.parse(await fs.readFile(path.join(BUILD,'evidence.json'),'utf8'));
const W=960.094488*4/3,H=720,M=68,CW=W-2*M;
const C={blue:'#1F4E79',ink:'#1B2733',muted:'#486581',teal:'#2F6F8F',line:'#D0DCE8',light:'#F4F8FC',white:'#FFFFFF',green:'#2B7A4B',gold:'#9A7B2A',gray:'#9FB3C8'};
const FONT='DejaVu Sans';
const deck=Presentation.create({slideSize:{width:W,height:H}});
const sources={
 common:'Материалы: исходная презентация первого блока. Текущая реализация в проектах spo 3 и spo-auth, состояние на 05.11.2026.',
 auth:'Код: backend/auth-service/src/main/java/ru/spo/auth/{web,service,config}; application.yml; db/migration/V2__seed_roles.sql.',
 skills:'Код: frontend/src/shared/lib/skill-demand.ts; frontend/src/mocks/{skills,vacancies}.ts; frontend/src/features/skills; Java-пакет ru.spo.auth.mock.',
 data:'Данные: синтетические вакансии текущего генератора, seed 42. Агрегация на 05.11.2026, завершённые месяцы. Файл расчётов: evidence.json.',
 tests:'Проверки: frontend/tests/skills-api.test.js; skill-demand.test.js; Java MockSkillDataTest и MockVacancyControllerTest. Результаты текущей проверки проекта.'
};
function text(slide,str,x,y,w,h,size=18,color=C.ink,bold=false,opts={}) {
 const s=slide.shapes.add({geometry:'textbox',name:opts.name??String(str).slice(0,55),position:{left:x,top:y,width:w,height:h},fill:opts.fill??'none',line:{fill:'none',width:0}});
 s.text=str;
 s.text.style={fontSize:size,typeface:FONT,color,bold,alignment:opts.align??'left',verticalAlignment:'top',wrap:true,autoFit:'none',insets:opts.padding??0};
 return s;
}
function rect(slide,x,y,w,h,fill,line=C.line,dashed=false) {
 return slide.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:1,style:dashed?'dashed':'solid'}});
}
function add(n,source=sources.skills) {
 const s=deck.slides.add();s.background.fill=C.white;
 text(s,content[n-1].title,M,49,CW,46,30,C.blue,true,{name:'slide-title'});
 text(s,content[n-1].subtitle,M,96,CW,31,17,C.muted);
 rect(s,M,137,CW,1.5,C.line,C.line);
 text(s,String(n),W-M-24,H-40,24,18,12,C.gray,false,{align:'right'});
 s.speakerNotes.text=content[n-1].notes+'\n\n'+sources.common+'\n'+source;
 return s;
}
function bodyRows(s,items,x=M,y=180,w=CW,gap=70,size=20) {
 for(let i=0;i<items.length;i++) text(s,items[i],x,y+i*gap,w,gap-16,size);
}
function callout(s,str,y=584,h=58) {
 rect(s,M,y,CW,h,C.light,C.light);rect(s,M,y,4,h,C.blue,C.blue);
 text(s,str,M+18,y+12,CW-36,h-20,18,C.ink);
}
function table(s,headers,rows,{x=M,y=165,width=CW,height=390,widths=null,size=18}={}) {
 const values=[headers,...rows];
 const t=s.tables.add({rows:values.length,columns:headers.length,left:x,top:y,width,height,values,...(widths?{columnWidths:widths}:{})});
 t.borders.assign({fill:C.line,width:1,style:'solid'});
 for(let r=0;r<values.length;r++) {
  for(let c=0;c<headers.length;c++){
   const cell=t.getCell(r,c);cell.fill=r===0?C.blue:r%2?C.light:C.white;
   cell.text.style={typeface:FONT,fontSize:size,color:r===0?C.white:C.ink,bold:r===0,verticalAlignment:'middle'};
  }
 }
 t.cells.block({row:0,column:0,rowCount:values.length,columnCount:headers.length}).assign({margins:{left:11,right:11,top:9,bottom:9}});
 return t;
}
function node(s,label,x,y,w,h,dashed=false,fill=C.light){
 const sh=rect(s,x,y,w,h,fill,dashed?C.gold:C.blue,dashed);
 text(s,label,x+12,y+14,w-24,h-22,17,dashed?C.gold:C.blue,true,{align:'center'});
 return sh;
}
function connect(s,a,b,from='bottom',to='top',dashed=false){s.shapes.connect(a,b,{kind:'straight',fromSide:from,toSide:to,line:{fill:dashed?C.gold:C.muted,width:1.6,style:dashed?'dashed':'solid'},tail:{type:'triangle',width:'sm',length:'sm'}})}
function row(response,id){return response.summary.find(s=>s.skill===id)}
const pct=v=>v.toFixed(1).replace('.',',')+'%';

// 1. Титульный лист повторяет палитру, поля и состав авторов исходника.
{
 const s=deck.slides.add();s.background.fill=C.blue;
 text(s,'HH Stack Radar',90,135,1100,70,48,C.white,true);
 text(s,'Радар навыков и авторизация',90,220,1100,55,35,C.white,true);
 text(s,'Промежуточные результаты разработки',90,296,1080,45,23,'#BCD4EA');
 text(s,'Гладких Иван Андреевич\nБогатырев Сергей Александрович\nСадовский Роман Сергеевич\nЦуканов Максим Дмитриевич',90,430,900,150,19,'#E3EDF7');
 s.speakerNotes.text=content[0].notes+'\n\n'+sources.common;
}
{
 const s=add(2,sources.common);
 table(s,['В первом блоке','Текущий результат'],[
  ['Архитектура из четырёх компонентов','Фронтенд и auth-service работают\nПоиск и парсер остаются следующим этапом'],
  ['График спроса по направлениям','Трекер публикаций Java и React\nДанные пока синтетические'],
  ['Стек каждой вакансии','Явные поля grade и skills\nФильтрация и история требований'],
  ['Ролевая модель доступа','Вход, JWT, refresh-сессии и права\nПроверка STATS_VIEW на API аналитики']
 ],{height:392,widths:[390,CW-390]});
 callout(s,'Результат этапа: проверяемый прототип. Реальный ежедневный сбор ещё предстоит подключить.');
}
{
 const s=add(3);const left=M,right=680,w=530;
 text(s,'Вопросы пользователя',left,178,w,35,22,C.teal,true);
 bodyRows(s,['Какие навыки требуют от Middle и Senior?','Как меняется доля конкретного инструмента?','Какие вакансии подтверждают требования?'],left,234,w,87,21);
 text(s,'Задачи реализации',right,178,w,35,22,C.teal,true);
 bodyRows(s,['Добавить грейд и стек в модель вакансии','Считать историю внутри выбранной группы','Связать фильтры графиков и списка вакансий'],right,234,w,87,21);
 callout(s,'Единица анализа: вакансия с грейдом, набором навыков и датой публикации.');
}
{
 const s=add(4);
 table(s,['Раздел','Реализованное поведение'],[
 ['Трекер вакансий','Количество новых публикаций по Java и React'],
 ['Фильтры радара','Направление, грейд, день / неделя / месяц / год'],
 ['Графики навыков','Динамика долей и радар двух завершённых периодов'],
 ['Таблица требований','Число вакансий, доля навыка, изменение в п.п.'],
 ['Последние вакансии','Те же направление и грейд, видимый стек'],
 ['Доступ','Сессия пользователя и право STATS_VIEW']
 ],{height:400,widths:[310,CW-310]});
 callout(s,'Все аналитические значения на этом этапе рассчитываются по моковым публикациям.');
}
{
 const s=add(5,sources.auth+'\n'+sources.skills);
 const browser=node(s,'Браузер\nИнтерфейс аналитики',M,190,255,93);
 const next=node(s,'Next.js 16\nФронтенд и API proxy',435,190,300,93);
 const auth=node(s,'Spring Boot auth-service\nВход, роли и refresh-сессии',880,190,332,93);
 connect(s,browser,next,'right','left');connect(s,next,auth,'right','left');
 const mocks=node(s,'Временный пакет mock\nВакансии и аналитика навыков',880,360,332,100);
 connect(s,auth,mocks);
 const pg=node(s,'PostgreSQL 16\nПользователи, роли, сессии',435,360,300,100);
 s.shapes.connect(auth,pg,{kind:'elbow',fromSide:'bottom',toSide:'top',line:{fill:C.muted,width:1.6},tail:{type:'triangle',width:'sm',length:'sm'}});
 const future=node(s,'Следующий этап\nparser-service и search-service',M,360,255,100,true);
 text(s,'Компоненты пока\nне подключены',M,490,255,55,17,C.muted);
 text(s,'API работает через один origin\nДанные аналитики пока в памяти',435,494,760,58,18,C.muted);
 callout(s,'USE_MOCKS=true: автономные обработчики Next.js. Основной режим: proxy к Java-сервису.',590);
}
{
 const s=add(6,sources.auth);
 table(s,['Роль','Права в текущем API','Резерв под следующие функции'],[
 ['USER','Просмотр аналитики\nSTATS_VIEW','Фильтры и наблюдение за компаниями'],
 ['ANALYST','Права USER','COLLECT_RUN, REPORT_EXPORT'],
 ['ADMIN','Права ANALYST\nУправление пользователями и ролями','Справочники, расписание, аудит']
 ],{height:255,widths:[170,420,CW-590]});
 text(s,'Access JWT: 15 минут, подпись RSA, хранение в памяти вкладки',M,455,CW,34,20);
 text(s,'Refresh: httpOnly cookie, 30 дней, ротация при обновлении',M,500,CW,34,20);
 callout(s,'API проверяет конкретные права. Не все функции, под которые заведены права, уже имеют экран.');
}
{
 const s=add(7);
 table(s,['Поле','Смысл','Пример'],[
 ['direction','Направление вакансии','java'],
 ['grade','Уровень требований','junior / middle / senior / lead'],
 ['skills','Идентификаторы навыков','java, spring, docker, kubernetes'],
 ['publishedAt','Момент включения в историю','Дата публикации в UTC'],
 ['id, title, company','Идентификация и отображение','Название и работодатель']
 ],{height:340,widths:[230,390,CW-620]});
 text(s,'Каталог skills задаёт подписи: kubernetes = Kubernetes (k8s)',M,535,CW,34,20,C.teal,true);
 callout(s,'История отражает требования новых публикаций. Версии редактирования одного объявления пока не моделируются.');
}
{
 const s=add(8);
 table(s,['Грейд','Правила генерации требований'],[
 ['Junior','Базовый стек. Kafka, Docker и CI/CD исключены в демо-сценарии'],
 ['Middle','Прикладной стек. Kubernetes и архитектура исключены'],
 ['Senior','Возможны Kubernetes и проектирование систем'],
 ['Lead','Возможны Kubernetes и проектирование систем']
 ],{height:300,widths:[210,CW-210]});
 text(s,'История: 3 года, React и Java. Вероятности навыков меняются по времени.',M,495,CW,58,20);
 callout(s,'Правила условные и нужны для проверки механизма. Это не универсальные требования рынка.');
}
{
 const s=add(9);
 text(s,'Доля навыка = вакансии с навыком / все вакансии выбранной группы × 100%',M,177,CW,70,24,C.blue,true);
 table(s,['Случай','Результат расчёта'],[
 ['Учебный пример: 70 вакансий из 100','70%'],
 ['Ранее 60%, сейчас 70%','Изменение +10 процентных пунктов'],
 ['Навыка нет, вакансии есть','0%'],
 ['Вакансий за период нет','null, в интерфейсе «Нет данных»']
 ],{y:265,height:270,widths:[650,CW-650]});
 callout(s,'Сравнение использует два завершённых периода. Текущая корзина остаётся только в истории.');
}
{
 const s=add(10,sources.data);
 text(s,'Шкала: 0-100%',M,555,200,25,15,C.muted);
 const ids=['java','spring','docker','kubernetes','cicd','testing'];
 const labels=['Java','Spring Boot','Docker','Kubernetes','CI/CD','Тесты'];
 const chart=s.charts.add('radar',{
  position:{left:M,top:185,width:620,height:340},categories:labels,
  series:[{name:'Сентябрь',values:ids.map(id=>Number((row(evidence.senior,id).previousShare/100).toFixed(6))),line:{fill:C.gray,width:2},fill:C.gray+'33'},
   {name:'Октябрь',values:ids.map(id=>Number((row(evidence.senior,id).lastCompleteShare/100).toFixed(6))),line:{fill:C.blue,width:2.5},fill:C.blue+'33'}],
  radarOptions:{style:'standard'},hasLegend:true,legend:{position:'right',textStyle:{fontSize:15}},
  xAxis:{textStyle:{fontSize:16,fill:C.ink}},yAxis:{min:0,max:1,majorUnit:.25,numberFormatCode:'0%',textStyle:{fontSize:13}},
 });applyPresentationChartFont(chart,{fontFamily:FONT});
 const sr=row(evidence.senior,'kubernetes');
 table(s,['Kubernetes','Октябрь'],[['Middle',pct(row(evidence.middle,'kubernetes').lastCompleteShare)],['Senior',pct(sr.lastCompleteShare)]],{x:750,y:190,width:462,height:180,widths:[260,202],size:20});
 text(s,`Senior: ${sr.lastComplete} из ${evidence.senior.buckets.at(-2).total} вакансий\nСентябрь: ${pct(sr.previousShare)}\nИзменение: +${sr.changePp.toFixed(1).replace('.',',')} п.п.`,750,410,462,130,21,C.ink);
 callout(s,'Источник: синтетический набор проекта, срез 05.11.2026. Проценты не описывают рынок hh.ru.');
}
{
 const s=add(11,sources.data);
 const bs=evidence.react.buckets.slice(-7,-1);
 const names=['май','июнь','июль','август','сентябрь','октябрь'];
 const ch=s.charts.add('line',{
  position:{left:M,top:170,width:CW,height:390},categories:names,
  series:[['typescript','TypeScript',C.blue],['nextjs','Next.js',C.teal],['redux','Redux',C.gold]].map(([id,name,color])=>({name,values:bs.map(b=>Number((b.counts[id]/b.total).toFixed(6))),line:{fill:color,width:3},smooth:false,marker:{symbol:'circle',size:5,fill:color}})),
  hasLegend:true,legend:{position:'bottom',textStyle:{fontSize:18}},
  yAxis:{min:0,max:1,majorUnit:.25,numberFormatCode:'0%',textStyle:{fontSize:16},majorGridlines:{fill:C.line,width:1}},
  xAxis:{textStyle:{fontSize:17},line:{fill:C.line,width:1}},displayBlanksAs:'gap',
 });applyPresentationChartFont(ch,{fontFamily:FONT});
 callout(s,'Синтетические данные, 2026 год. Размер месячной выборки: '+bs.map(b=>b.total).join(', ')+'. Одна точка не доказывает устойчивый тренд.',584,66);
}
{
 const s=add(12,sources.skills+'\nКонтракт: api/openapi.yaml в обоих проектах.');
 table(s,['Маршрут','Назначение','Фильтры'],[
 ['/api/vacancies/demand','История числа публикаций','period, directions'],
 ['/api/vacancies/skills','История и сводка требований','period, directions, grades'],
 ['/api/vacancies','Последние вакансии со стеком','directions, grades, limit']
 ],{height:245,widths:[380,400,CW-780],size:17});
 text(s,'Контракт OpenAPI обновлён в spo 3 и spo-auth',M,453,CW,35,22,C.teal,true);
 text(s,'400: неверные фильтры. 401: нет сессии. 403: нет права STATS_VIEW.',M,505,CW,55,20);
 callout(s,'Моки Next.js и временный Java API возвращают один формат данных.');
}
{
 const s=add(13);
 const steps=[['01','Вход в систему','Открыть трекер публикаций Java и React'],['02','Java и Middle','Показать отсутствие Kubernetes в демо-выборке'],['03','Java и Senior','Проверить изменение требований и списка вакансий'],['04','История навыка','Выбрать Kubernetes, сменить месяц на неделю или год'],['05','Конкретная вакансия','Показать грейд и требуемый стек']];
 steps.forEach(([n,title,desc],i)=>{const y=173+i*78;text(s,n,M,y,60,38,28,C.teal,true);text(s,title,M+80,y,CW-80,30,22,C.blue,true);text(s,desc,M+80,y+34,CW-80,31,18,C.ink)});
}
{
 const s=add(14,sources.tests);
 table(s,['Уровень','Проверяемые случаи','Результат'],[
 ['Frontend','Агрегация, фильтры и mock API','12 тестов'],
 ['Java','Расчёты, грейды и доступ к API','7 сценариев в каждом проекте'],
 ['Границы расчёта','Пустая выборка, дубли, будущие даты,\nнезавершённый период','Проверены'],
 ['Интерфейс','Выбор грейда и направления,\nпереключение периодов','Проверен в браузере'],
 ['Сборка','TypeScript и production build','Выполнены']
 ],{height:370,widths:[220,540,CW-760],size:18});
 callout(s,'Исправления по тестам: корректный 403 и устранение искусственных скачков генератора.');
}
{
 const s=add(15,sources.common);
 table(s,['Направление работ','Ожидаемый результат'],[
 ['Реальный сбор','Parser-service и сохранение вакансий hh.ru'],
 ['Нормализация навыков','Синонимы и оценка качества на ручной разметке'],
 ['Выделение аналитики','Search-service с текущим контрактом API'],
 ['Расширение продукта','Новые направления, сравнение компаний, экспорт'],
 ['Подготовка стенда','Сквозные проверки с БД, актуализация зависимостей']
 ],{height:360,widths:[360,CW-360]});
 callout(s,'Приоритет: подключить источник и подтвердить качество данных, затем расширять охват.');
}
{
 const s=add(16,sources.common);
 bodyRows(s,[
 'Вакансия содержит явный грейд и набор требований',
 'Радар показывает доли навыков и историю их изменения',
 'Фильтры согласованы между графиками и последними вакансиями',
 'Авторизация и права доступа работают через Java-сервис',
 'Реальный сбор и нормализация данных входят в следующий этап'
 ],M,181,CW,67,23);
 callout(s,'Готовы ответить на вопросы по расчётам, архитектуре и дальнейшему развитию.');
}

await fs.mkdir(path.join(BUILD,'renders'),{recursive:true});
const candidate=path.join(BUILD,'candidate.pptx');
await (await PresentationFile.exportPptx(deck)).save(candidate);
console.log('EXPORTED',candidate);
for(let i=0;i<deck.slides.items.length;i++) {
 const slide=deck.slides.items[i];
 const png=await deck.export({slide,format:'png',scale:1});
 await fs.writeFile(path.join(BUILD,'renders',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
 console.log('RENDERED',i+1);
}
const refhash=crypto.createHash('sha256').update(await fs.readFile(REFERENCE)).digest('hex');
const result=await finalizePresentation({
 workspaceDir:ROOT,candidatePath:candidate,finalPath:path.join(OUT,'HH_Stack_Radar_block_2.pptx'),
 pythonExecutable:PYTHON,
 integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu',`${Math.round(W*9525)},${Math.round(H*9525)}`,'--validate-heading-fit',...[2,4,6,7,8,9,10,12,14,15].flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:16,
 requiredNativeTableOwnerSlides:[2,4,6,7,8,9,10,12,14,15],
 requiredNativeChartOwnerSlides:[10,11],materializeLiteralChartWorkbooks:true,
 fontPolicy:{basis:'reference',families:[FONT],referencePath:REFERENCE,referenceSha256:refhash},
 verifyArtifactToolImport:true,receiptPath:path.join(BUILD,'validation.json')
});
console.log('FINALIZED',JSON.stringify(result));
const pdf=await deck.export({format:'pdf'});
await fs.writeFile(path.join(OUT,'HH_Stack_Radar_block_2.pdf'),new Uint8Array(await pdf.arrayBuffer()));
console.log('PDF exported');
