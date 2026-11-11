import json, os, re
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from xml.sax.saxutils import escape

root=Path('/Users/sergey/Desktop/spo 3')
build=root/'tmp/presentation-block-2/build'
out=root/'output/defense-block-2'
fontdir=Path('/Users/sergey/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
pdfmetrics.registerFont(TTFont('DejaVu',str(fontdir/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-Bold',str(fontdir/'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DejaVu',normal='DejaVu',bold='DejaVu-Bold',italic='DejaVu',boldItalic='DejaVu-Bold')
blue=colors.HexColor('#1F4E79');ink=colors.HexColor('#1B2733');muted=colors.HexColor('#486581')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle',fontName='DejaVu-Bold',fontSize=23,leading=31,textColor=blue,spaceAfter=18))
styles.add(ParagraphStyle(name='Sub',fontName='DejaVu',fontSize=11,leading=17,textColor=muted,spaceAfter=16))
styles.add(ParagraphStyle(name='SlideTitle',fontName='DejaVu-Bold',fontSize=13.5,leading=20,textColor=blue,spaceBefore=15,spaceAfter=8,keepWithNext=True))
styles.add(ParagraphStyle(name='BodyRu',fontName='DejaVu',fontSize=11,leading=17,textColor=ink,spaceAfter=8))
styles.add(ParagraphStyle(name='QuestionRu',fontName='DejaVu-Bold',fontSize=10.5,leading=15,textColor=blue,spaceBefore=8,spaceAfter=4,keepWithNext=True))
styles.add(ParagraphStyle(name='QABody',fontName='DejaVu',fontSize=10.5,leading=15,textColor=ink,spaceAfter=6))
content=json.loads((build/'content.json').read_text())
qa=[
('Почему пока используются моки?', 'Они позволяют независимо проверить интерфейс, формулы, грейды и временные периоды. Реальный сбор ещё не подключён. После его появления контракт API можно сохранить, заменив источник данных.'),
('Откуда берётся грейд?', 'Сейчас его явно задаёт генератор вместе с названием вакансии. Автоматическое определение грейда из реальных объявлений ещё предстоит реализовать и оценить на ручной разметке.'),
('Почему у Middle нет Kubernetes?', 'Это условие демонстрационного набора для проверки фильтра. В реальном рынке такая комбинация возможна. Будущий парсер должен сохранять обнаруженные требования, а не навязывать правило из моков.'),
('Чем процентные пункты отличаются от процентов?', 'Изменение с 60% до 70% составляет +10 процентных пунктов. Относительный рост был бы около 16,7%. В таблице требований показаны именно процентные пункты.'),
('Что означает нулевая доля?', 'В непустой выборке ни одна вакансия не требует навык. Если сама выборка пустая, API возвращает null, чтобы не представлять отсутствие наблюдений как нулевой спрос.'),
('Хранится ли история изменений одной вакансии?', 'Пока история строится по требованиям на дату публикации. Версии редактирования одного объявления и их сравнение не реализованы.'),
('Зачем аналитика находится внутри auth-service?', 'Это временный пакет mock для работы фронтенда с настоящей авторизацией. Целевая архитектура предусматривает перенос аналитических маршрутов в search-service.'),
('Какие проверки доступа реализованы?', 'Защищённый API требует аутентификацию и конкретное право, для аналитики STATS_VIEW. Проверены 401 без входа и 403 при отсутствии права. Пользовательские экраны для всех административных функций ещё предстоит завершить.'),
('Можно ли по показанным графикам делать выводы о рынке?', 'Нет, показанные числа получены из генератора. Они демонстрируют работу расчётов. Рыночные выводы требуют реальных данных, достаточной выборки и проверки качества извлечения навыков.')
]
def footer(c,doc):
 c.saveState();w,h=A4
 c.setStrokeColor(colors.HexColor('#D0DCE8'));c.line(45,39,w-45,39)
 c.setFont('DejaVu',8);c.setFillColor(muted)
 c.drawString(45,26,'HH Stack Radar. Доклад к промежуточной защите')
 c.drawRightString(w-45,26,str(doc.page));c.restoreState()
path=out/'HH_Stack_Radar_block_2_speech.pdf'
doc=SimpleDocTemplate(str(path),pagesize=A4,rightMargin=45,leftMargin=45,topMargin=43,bottomMargin=54,title='HH Stack Radar: текст выступления',author='Гладких И.А.; Богатырев С.А.; Садовский Р.С.; Цуканов М.Д.')
story=[Paragraph('HH Stack Radar<br/>Текст выступления',styles['CoverTitle']),Paragraph('Радар навыков и авторизация. Промежуточные результаты разработки.<br/>Ориентир: 8-10 минут, 16 слайдов.',styles['Sub'])]
for i,s in enumerate(content,1):
 story.append(Paragraph(f'Слайд {i}. {escape(s["title"])}',styles['SlideTitle']))
 story.append(Paragraph(escape(s['notes']),styles['BodyRu']))
story.extend([PageBreak(),Paragraph('Ответы на возможные вопросы',styles['CoverTitle'])])
for q,a in qa:
 story.append(Paragraph(escape(q),styles['QuestionRu']));story.append(Paragraph(escape(a),styles['QABody']))
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print('Speech PDF:',path)
print('Speech word count:',len(' '.join(s['notes'] for s in content).split()))
