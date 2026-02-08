import os, io
from PIL import Image, ImageDraw, ImageFont, ImageOps
from flask import Flask, render_template, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
import string
import random
import pymysql
import uuid
import logging
import time

app = Flask(__name__)
current_dir = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = current_dir+'/static/uploads/'
UPLOAD_FOLDER_GRAPH = current_dir+'/static/graph/'
UPLOAD_FOLDER2 = current_dir+'/static/supersave/'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['UPLOAD_FOLDER2'] = UPLOAD_FOLDER2

#관상해석
r1_power = 3
r1_old = 5
r2_sprit = 5
r2_adult = 3
r2_love = 4
r2_jeal = 1
r3_work = 4
r3_social = 4
r3_someone = 1
r3_money = 4
r4_kind = 3
r4_wind = 1
r4_respon = 3
r4_since = 3


def drawVertices(image_source, vertices, filename, fd_line, facepoint,lefteyename, righteyename, nosename, mouthname,vertice1,timekey,selected_radio,filename_dot,radius):
    pillow_img = Image.open(io.BytesIO(image_source))
        #고유값 생성
    # _LENGTH = 5 #5자리
    # string_pool = string.ascii_uppercase
    # strkey = "" #결과값
    # for i in range(5):
    #     strkey += random.choice(string_pool)
    facecode = str(uuid.uuid4())
    # if pillow_img.mode == 'RGB':
    #     pillow_img = pillow_img.convert('RGBA')
    #     print(f'이미지가 24비트에서 32비트로 변환되었습니다.')
    # else:
    #     print('이미지는 이미 32비트입니다.')

    #이미지 비트 변환
    if pillow_img.mode == 'RGBA':
        pillow_img = pillow_img.convert('RGB')
        print(f'이미지가 32비트에서 24비트로 변환되었습니다.')
    else:
        print('이미지는 이미 24비트입니다.')
    draw = ImageDraw.Draw(pillow_img, 'RGBA')

    facereview = []

    #ld_lefteye
    #draw.ellipse((vertices[0].x, vertices[0].y,vertices[0].x+ellipse_size,vertices[0].y+ellipse_size), fill='green', outline='white')
    firsty = vertices[len(vertices) -1].y
    secondy = vertices[0].y
    # print(firsty)
    # print(type(firsty))
    # print(secondy)
    # print(type(secondy))
    ylenth = firsty - secondy
    #########
    ######
    #1. face 가로 기준비율 코넓이
    widthratio = float(facepoint[13].x)-float(facepoint[14].x)
    widthratio2 = float(facepoint[27].x)-float(facepoint[26].x)
    ###### 중요
    #########20240416 주석
    # print("widthratio!!! = ",widthratio)
    #2. face 비율 계산
    ratio1 = (float(facepoint[0].y)-float(facepoint[24].y))/widthratio
    # print("ratio1==",ratio1)
    ratio2 = (float(facepoint[15].y)-float(facepoint[0].y))/widthratio
    # print("ratio2==",ratio2)
    ratio3 = (float(facepoint[12].y)-float(facepoint[15].y))/widthratio
    # print("ratio3==",ratio3)
    ratio4 = (float(facepoint[29].y)-float(facepoint[12].y))/widthratio
    # print("ratio4==",ratio4)
    ratio5 = (float(facepoint[15].y)-float(facepoint[24].y))/widthratio
    # print("ratio5==",ratio5)
    ratio7 = (float(facepoint[11].x)-float(facepoint[10].x))/widthratio
    # print("ratio7==",ratio7)
    ratio8 = (float(facepoint[31].x)-float(facepoint[30].x))/widthratio2
    # print("ratio8==",ratio8)
    print("##########해석############")
    
    facescore = 0
    r1 = 0
    r2 = 0
    r3 = 0
    r4 = 0
    r1_power_sum = 0
    r1_old_sum = 0
    r2_sprit_sum = 0
    r2_adult_sum = 0
    r2_love_sum = 0
    r2_jeal_sum = 0
    r3_work_sum = 0
    r3_social_sum = 0
    r3_someone_sum = 0
    r3_money_sum = 0
    r4_kind_sum = 0
    r4_wind_sum = 0
    r4_respon_sum = 0
    r4_since_sum = 0
    whytext = ""

    faceratio = float(facepoint[17].x)-float(facepoint[19].x)
    #########얼굴의 기울기
    aangle =  (float(facepoint[23].y)-float(facepoint[17].y))/(float(facepoint[23].x)-float(facepoint[17].x))
    # 20240416 주석
    # print("눈앞 기울기",aangle)
    bangle =  (float(facepoint[21].y)-float(facepoint[19].y))/(float(facepoint[21].x)-float(facepoint[19].x))
    # print("눈뒤 기울기",bangle)
    #b값 구하기
    b1spot = float(facepoint[23].y)-aangle*float(facepoint[23].x)
    b2spot = float(facepoint[21].y)-aangle*float(facepoint[21].x)
    # 20240416 주석
    # print("b1spot",b1spot)
    # print("b2spot",b2spot)
    #b - a 가 +면 눈꼬리 올리감, -면 눈꼬리 내려감
    b1_y = aangle*float(facepoint[6].x)+b1spot
    b2_y = aangle*float(facepoint[6].x)+b2spot
    # print(b1_y,"/",b2_y,"/", b2_y-b1_y)
    # print(b1_y/faceratio,"/",b2_y/faceratio,"/", (b2_y-b1_y)/faceratio)
    # faceangle = b2_y-b1_y
    faceangle = (b2_y-b1_y)/faceratio*100
    # print("faceangle : ",faceangle)
    if faceangle > -2.0:
        eye_updown = "눈꼬리 내려감"
        # eye_updown_read = "성품이 부드럽지만 때로는 스트레스를 받기 쉽습니다. 아이들을 좋아하며 연인 상대로 연하를 좋아하는 경향이 있습니다. 주의 환경에 잘 적응하고 자신의 의견을 굽히며 남 배려를 잘합니다. 하지만 폭발할 수 있기 때문에 주의가 필요합니다. 자제심이 적어 외도를 할 수 있습니다."
        eye_updown_read = "이 사람은 마음이 부드러우며 타인에 대한 배려가 깊어, 주변 환경에 능동적으로 적응하는 능력이 뛰어납니다. 어린이에 대한 애정이 많고, 연애에서는 자신보다 연령이 어린 상대를 선호하는 경향이 있습니다. 의견을 유연하게 조정할 줄 알며, 상대방을 위해 자신의 욕구를 억제할 줄 아는 편입니다. 그러나 내면의 스트레스가 쌓이면 예기치 않게 감정이 폭발할 위험이 있으므로, 이러한 점을 주의 깊게 관리해야 합니다. 자제력이 다소 부족한 면이 있어, 유혹에 쉽게 빠질 수 있는 경향도 있으니, 이 부분에 대한 자각과 개선이 필요합니다."
        facescore += r2_sprit*1
        r2_sprit_sum += r2_sprit*1
        r2 += r2_sprit*1

        facescore += r2_adult*1
        r2_adult_sum += r2_adult*1
        r2 += r2_adult*1

        facescore += r4_kind*2
        r4 += r4_kind*2
        r4_kind_sum += r4_kind*2

        facescore += r4_wind*1
        r4 += r4_wind*1
        r4_wind_sum += r4_wind*1
    elif faceangle <= -2.0 and faceangle > -4.0:
        eye_updown = "눈꼬리 일자"
        # eye_updown_read = "성격에 강단이 있지만 대담함이 약간 부족합니다. 감정의 기복이 적지만 지나치게 무덤하기도 합니다."
        eye_updown_read = "내면에 강한 의지와 결단력을 지니고 있지만, 때때로 대담한 행동을 취하는 데 있어 약간의 망설임이 있습니다. 감정의 기복이 크지 않아 일관된 태도를 유지하는 데 강점을 가지고 있으나, 이러한 평정심이 지나쳐 어떤 상황에서도 무덤덤한 반응을 보이기도 합니다. 이는 상황에 따라 안정감을 주는 장점으로 작용할 수 있으나, 다른 한편으로는 열정이나 감정의 표현이 부족하다고 느껴질 수 있어, 적절한 균형을 찾는 것이 중요합니다."
        facescore += r2_sprit*3
        r2 += r2_sprit*3
        r2_sprit_sum += r2_sprit*3

        facescore += r2_adult*3
        r2 += r2_adult*3
        r2_adult_sum += r2_adult*3

        facescore += r4_kind*5
        r4 += r4_kind*5
        r4_kind_sum += r4_kind*5

        facescore += r4_wind*3
        r4 += r4_wind*3
        r4_wind_sum += r4_wind*3
    elif faceangle <= -4.0 and faceangle > -11.0:
        eye_updown = "눈꼬리 올라감"
        # eye_updown_read = "대담하고 용기가 많으며 적극적이며 밝습니다. 주로 실패를 두려워하지 않아서 적절한 행동을 취하고 자수성가 하는 사람에게 많이 볼 수 있습니다. 단 감정의 기복이 심할 수 있으며 거짓말을 잘 못해서 뻔한 거짓말을 해버리는 경향이 있습니다. 연애는 속박하는 경향이 있습니다. "
        eye_updown_read = "대담하고 용기 넘치며, 언제나 적극적이고 밝은 에너지를 발산합니다. 실패에 대한 두려움이 없어, 도전적인 상황에서도 적절하고 과감한 행동을 취하는 경향이 있습니다. 이러한 특성은 자수성가한 인물들에게서 흔히 볼 수 있는 덕목으로, 그들의 성공 배경에는 이 같은 끊임없는 도전 정신이 자리 잡고 있습니다. 그러나 감정의 기복이 심해 때로는 예측 불가능한 반응을 보일 수 있으며, 거짓말을 하는 데 서툴러 투명하게 드러나는 거짓말을 할 수도 있습니다."
        solution1 = "뻔한 거짓말로 인해 대인 관계에서 불화를 가져올 수 있으니 거짓말을 피해야 합니다. "
        solution2 = "중년기에 큰 행운이 찾아온다고 하니 조급할 필요 없습니다. "
        facescore += r2_sprit*4
        r2 += r2_sprit*4
        r2_sprit_sum += r2_sprit*4

        facescore += r2_adult*4
        r2 += r2_adult*4
        r2_adult_sum += r2_adult*4

        facescore += r4_kind*4
        r4 += r4_kind*4
        r4_kind_sum += r4_kind*4

        facescore += r4_wind*4
        r4 += r4_wind*4
        r4_wind_sum += r4_wind*4
    else:
        eye_updown = "눈꼬리 많이 올라감"
        # eye_updown_read = "기상이 하늘을 찌르며 모든면에서 적극적이고 강인한 면모를 보입니다. 단 독불장군과 같은 고집을 보일 수 있습니다."
        eye_updown_read = "그 기상이 마치 하늘을 찌를 듯이 웅장하며, 모든 면에서 적극적이고 강인한 면모를 발휘합니다. 그의 태도는 어떠한 도전이라도 두려워하지 않는 용기와 결단력을 상징하며, 이는 그를 주변 사람들로부터 존경받게 만드는 원동력입니다. 그러나 이러한 강렬한 성품에는 독불장군과 같은 고집스러움이 동반되기도 합니다. 그의 이러한 고집은 때로는 상황을 주도하고 문제를 해결하는 데 있어 큰 장점으로 작용하지만, 다른 한편으로는 협력과 타협이 필요한 순간에 장애가 될 수 있습니다. 따라서, 그의 리더십과 독립적인 성향이 더욱 긍정적인 결과를 이끌어내기 위해서는 융통성과 다른 사람들의 의견에 귀 기울일 필요가 있습니다."
        facescore += r2_sprit*5
        r2 += r2_sprit*5
        r2_sprit_sum += r2_sprit*5

        facescore += r2_adult*4
        r2 += r2_adult*4
        r2_adult_sum += r2_adult*4

        facescore += r4_kind*1
        r4 += r4_kind*1
        r4_kind_sum += r4_kind*1

        facescore += r4_wind*5
        r4 += r4_wind*5
        r4_wind_sum += r4_wind*5
    # print("눈꼬리는? ",eye_updown)

    #눈썹거리
    ratio1_1_a = "눈과 눈썹 사이가 엄청 멀다"
    ratio1_2_a = "눈과 눈썹 사이가 먼편이다."
    ratio1_3_a = "눈과 눈썹 사이가 아주 이상적이다."
    ratio1_4_a = "눈과 눈썹 사이가 좁다."
    
    # ratio1_1_b = "복이 많습니다. 부모나 위 조상의 유산을 물려받거나 조상의 덕을 볼일이 생깁니다. 낙천적, 개방적이지만 계산이나 문서 작성할 때 맺고 끊음을 확실히 해야합니다."
    # ratio1_2_b = "복이 많은 편 입니다. 부모가 온전하고 낙천적인 경향이 있습니다. 다만 온순하고 착한 성격 때문에 문제가 될 수 있으니 공과 사의 구분을 잘 하려고 노력해야 합니다."
    # ratio1_3_b = "외적으로는 이상적인 눈두덩이 비율입니다. 인생의 굴곡이 다소 있을 수 있으나 마음의 여유를 갖으면 순탄할 것입니다."
    # ratio1_4_b = "부모나 조상의 유산은 별로 없습니다. 하지만 걱정하지 마세요 자수성가할 확률이 높습니다. 일처리 또한 섬세하고 꼼꼼합니다. 공과 사가 확실하지만 냉철하다는 평을 받기도 합니다. 지나치게 완벽주의로 흐르지 않도록 주의해야합니다."
    # 길게 풀이
    # ratio1_1_b = "타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 보는 일이 자주 발생합니다. 이러한 행운은 그의 낙천적이고 개방적인 성격과 맞물려, 주변 사람들에게 긍정적인 에너지를 발산하게 만듭니다. 그러나, 재물과 관련된 계산이나 문서 작성과 같은 정밀한 활동에 있어서는 보다 주의 깊은 접근이 필요합니다. 맺고 끊는 것을 확실히 하여, 그의 행운이 장기적으로 지속될 수 있도록 철저한 관리와 계획이 요구됩니다. 이는 그가 누리는 행운을 지키고, 더욱 번창할 수 있는 기반을 마련하는 데 중요한 역할을 합니다."
    # ratio1_2_b = "자연스럽게 복이 많은 삶을 살고 있으며, 이는 부모님의 온전한 사랑과 지원, 그리고 그들의 낙천적인 성향에서 비롯된 것입니다. 그의 성격은 온순하고 착한 면모로 가득 차 있어, 주변 사람들에게 큰 호감을 줍니다. 그러나 이러한 성격이 때로는 개인적인 경계를 설정하는 데 어려움을 초래할 수 있으므로, 개인적인 감정과 직업적인 책임 사이에서 적절한 균형을 찾는 것이 중요합니다. 공적인 상황과 사적인 상황을 명확히 구분하려는 노력은 그가 건강한 인간관계를 유지하고, 자신의 복을 지키며 더욱 성장하는 데 필수적입니다. 이를 통해 그는 자신의 장점을 더욱 발휘하고, 잠재적인 문제에 대처하는 방법을 배울 수 있을 것입니다."
    # ratio1_3_b = "외적으로 보았을 때, 눈두덩이의 비율이 이상적으로 조화롭습니다. 이러한 조화로운 외모는 미적인 측면에서 많은 이점을 가져다주며, 자연스럽게 사람들의 호감을 얻는 데 유리합니다. 그의 인생 경로는 다소의 굴곡을 겪을 수 있으나, 이는 인생의 일부로 받아들일 필요가 있습니다. 중요한 것은 마음의 여유를 유지하는 태도입니다. 내면의 평화와 긍정적인 태도를 갖추면, 인생의 어려움들을 보다 순탄하게 극복할 수 있습니다. 이러한 여유는 또한 그가 자신의 삶을 더욱 풍요롭고 의미 있게 만드는 데 중요한 역할을 할 것입니다. 결국, 외적인 아름다움과 내적인 여유는 그의 삶을 보다 완성도 있고 만족스럽게 만드는 데 기여할 것입니다."
    # ratio1_4_b = "부모나 조상으로부터 상당한 유산을 물려받지 못했을 수 있지만, 그것이 그의 성공을 방해할 것이라고 걱정할 필요는 없습니다. 자신의 능력과 노력으로 성공을 이뤄내는 자수성가의 길이 그에게는 매우 높은 확률로 열려 있습니다. 그의 일 처리 방식은 섬세하고 꼼꼼하며, 이는 그가 맡은 업무를 탁월하게 수행하게 하는 주요 요인 중 하나입니다. 그는 업무와 개인 생활을 철저히 구분하는 능력을 지니고 있으며, 이로 인해 때때로 냉철하다는 평가를 받기도 합니다. 그러나 그의 완벽주의 경향은 때로는 과도해질 수 있으므로, 이에 대한 자각과 조절이 필요합니다. 지나친 완벽주의는 스스로에게 부담을 줄 수 있으니, 균형을 유지하는 것이 중요합니다."
    ratio1_1_b = "타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 보는 일이 자주 발생합니다. 그러나, 재물과 관련된 계산이나 문서 작성과 같은 정밀한 활동에 있어서는 보다 주의 깊은 접근이 필요합니다. 맺고 끊는 것을 확실히 하여, 행운이 장기적으로 지속될 수 있도록 철저한 관리와 계획이 요구됩니다."
    ratio1_2_b = "자연스럽게 복이 많은 삶을 살고 있으며, 이는 부모님의 온전한 사랑과 지원, 그리고 그들의 낙천적인 성향에서 비롯된 것입니다. 성격은 온순하고 착한 면모로 가득 차 있어, 주변 사람들에게 큰 호감을 줍니다. 그러나 이러한 성격이 때로는 개인적인 경계를 설정하는 데 어려움을 초래할 수 있습니다."
    ratio1_3_b = "외적으로 보았을 때, 눈두덩이의 비율이 이상적으로 조화롭습니다. 이러한 조화로운 외모는 미적인 측면에서 많은 이점을 가져다주며, 자연스럽게 사람들의 호감을 얻는 데 유리합니다. 인생 경로는 다소의 굴곡을 겪을 수 있으나, 이는 인생의 일부로 받아들일 필요가 있습니다. 중요한 것은 마음의 여유를 유지하는 태도입니다."
    ratio1_4_b = "부모나 조상으로부터 상당한 유산을 물려받지 못했을 수 있지만, 그것이 성공을 방해할 것이라고 걱정할 필요는 없습니다. 자신의 능력과 노력으로 성공을 이뤄내는 자수성가의 길이 매우 높은 확률로 열려 있습니다. 일 처리 방식은 섬세하고 꼼꼼하며, 이는 그가 맡은 업무를 탁월하게 수행하게 하는 주요 요인 중 하나입니다."

    if ratio1 > 0.8:
        ratio1a = ratio1_1_a
        ratio1b = ratio1_1_b
        facescore += r2_sprit*2
        r2 += r2_sprit*2
        r2_sprit_sum += r2_sprit*2

        facescore += r3_money*5
        r3 += r3_money*5
        r3_money_sum += r3_money*5
    elif ratio1 > 0.68 and ratio1 <= 0.8:
        ratio1a = ratio1_2_a
        ratio1b = ratio1_2_b
        facescore += r2_sprit*2
        r2 += r2_sprit*2
        r2_sprit_sum += r2_sprit*2

        facescore += r3_money*5
        r3 += r3_money*5
        r3_money_sum += r3_money*2
    elif ratio1 > 0.6 and ratio1 <= 0.68:
        ratio1a = ratio1_3_a
        ratio1b = ratio1_3_b
        facescore += r2_sprit*3


        r2 += r2_sprit*3
        r2_sprit_sum += r2_sprit*3

        facescore += r3_money*2
        r3 += r3_money*2
        r3_money_sum += r3_money*2
    else:
        ratio1a = ratio1_4_a
        ratio1b = ratio1_4_b
        facescore += r2_sprit*3
        r2 += r2_sprit*3
        r2_sprit_sum += r2_sprit*3

        facescore += r3_money*2
        r3 += r3_money*2
        r3_money_sum += r3_money*2
    # print(ratio1a)
    # print(ratio1b)
        
    #코길이
    # ratio2_1_a = "코가 엄청 길다."
    ratio2_2_a = "코가 길다."
    # ratio2_3_a = "코가 약간 길다."
    ratio2_4_a = "코 길이가 아주 이상적이다."
    # ratio2_5_a = "코가 짧은 편이다."
    ratio2_6_a = "코가 매우 짧다."
    
    # ratio2_1_b = "코가 엄청 길다.코가 엄청 길다.코가 엄청 길다.코가 엄청 길다.코가 엄청 길다.코가 엄청 길다."
    # ratio2_2_b = "책임감이 강하고 성실하다. 성격이 꼼꼼하고 자존심이 강해서 자신의 고집을 끝까지 유지하는 완고한 면이 있다. 장사를 하기에는 적합하지 않을 수 있다. 그리고 사교성이 부족한 부분이 있어서 노력으로 보완해주면 좋다. 연애는 이상이 아주 높기 때문에 눈이 높다는 소리를 듣고 산다."
    ratio2_2_b = "강한 책임감과 성실함을 바탕으로 일에 임하는 타입입니다. 그의 성격은 꼼꼼하며 자존심이 강해, 일단 결정한 바를 끝까지 밀고 나가는 완고한 면모를 가지고 있습니다. 이러한 성향은 여러 분야에서는 강점으로 작용할 수 있지만, 유동적이고 융통성을 요구하는 장사와 같은 영역에서는 다소 불리할 수 있습니다."
    # ratio2_3_b = "코가 약간 길다코가 약간 길다코가 약간 길다코가 약간 길다코가 약간 길다코가 약간 길다코가 약간 길다코가 약간 길다코가 약간 길다."
    # ratio2_4_b = "이상적인 중년의 모습이다. 적당히 평온한 모습을 갖추었고 두루두루 모나지 않는 능력치를 보여주면서 사회와 어울리며 나아간다."
    ratio2_4_b = "이상적인 중년의 모습을 그대로 담고 있습니다. 삶의 격랑을 거치며 얻은 평온함이 그의 태도와 마음가짐에 깊이 배어 있으며, 이를 통해 주변 사람들에게도 안정감을 제공합니다. 그는 눈에 띄게 돌출되거나 부족함 없이 균형 잡힌 능력을 지니고 있어, 다양한 사회적 상황에서 자신의 역할을 훌륭히 수행합니다."
    # ratio2_5_b = "코가 짧은 편이다코가 짧은 편이다코가 짧은 편이다코가 짧은 편이다."
    # ratio2_6_b = "낙관적이고 긍정적이다. 일도 연애도 잘 되는 사람이 많으며 상대의 기분을 파악하는데에 탁월한 재능을 가지고 있기 때문에 장사도 잘 어울린다. 단 어떠한 일을 깊이 생각하는 것에 서툴고 무책임한 행동을 하기 쉬우므로 신중히 하는게 좋다. 재물운이 좋지만 낭비가 있는 얼굴이기도 하다."
    ratio2_6_b = "타고난 낙관주의자로, 긍정적인 태도를 유지하는 데 뛰어난 능력을 지니고 있습니다. 이러한 긍정성은 일과 연애 모두에서 좋은 결과를 이끌어내는 원동력이 되며, 상대방의 기분과 필요를 정확히 파악하는 능력 덕분에 장사와 같은 상호작용을 요구하는 분야에서도 탁월한 성과를 보입니다. 그러나 깊이 있는 사고에 대한 서투름과 때로는 무책임한 행동으로 이어질 수 있습니다."

    if ratio2 > 1.55:#1.45
        ratio2a = ratio2_2_a
        ratio2b = ratio2_2_b
        facescore += r2_sprit*3
        r2 += r2_sprit*3
        r2_sprit_sum += r2_sprit*3

        facescore += r2_love*5
        r2 += r2_love*5
        r2_love_sum += r2_love*5

        facescore += r3_social*3
        r3 += r3_social*3
        r3_social_sum += r3_social*3

        facescore += r4_respon*5
        r4 += r4_respon*5
        r4_respon_sum += r4_respon*5

        facescore += r4_since*5
        r4 += r4_since*5
        r4_since_sum += r4_since*5
    # elif ratio2 <= 1.5 and ratio2 > 1.45:
    #     ratio2a = ratio2_3_a
    #     ratio2b = ratio2_3_b
    #     facescore += 2
    elif ratio2 <= 1.55 and ratio2 > 1.28:
        ratio2a = ratio2_4_a
        ratio2b = ratio2_4_b
        facescore += r2_sprit*3
        r2 += r2_sprit*3
        r2_sprit_sum += r2_sprit*3

        facescore += r2_love*4
        r2 += r2_love*4
        r2_love_sum += r2_love*4

        facescore += r3_social*4
        r3 += r3_social*4
        r3_social_sum += r3_social*4

        facescore += r4_respon*4
        r4 += r4_respon*4
        r4_respon_sum += r4_respon*4

        facescore += r4_since*4
        r4 += r4_since*4
        r4_since_sum += r4_since*4
    # elif ratio2 < 1.34 and ratio2 > 1.28:
    #     ratio2a = ratio2_5_a
    #     ratio2b = ratio2_5_b
    #     facescore += 1
    else:
        ratio2a = ratio2_6_a
        ratio2b = ratio2_6_b
        facescore += r2_sprit*4
        r2 += r2_sprit*4
        r2_sprit_sum += r2_sprit*4

        facescore += r2_love*2
        r2 += r2_love*2
        r2_love_sum += r2_love*2

        facescore += r3_social*4
        r3 += r3_social*4
        r3_social_sum += r3_social*4

        facescore += r4_respon*2
        r4 += r4_respon*2
        r4_respon_sum += r4_respon*2

        facescore += r4_since*3
        r4 += r4_since*3
        r4_since_sum += r4_since*3
    # print(ratio2a)
    # print(ratio2b)
    #인중길이
    ratio3_1_a = "인중이 엄청 길다."
    ratio3_2_a = "인중이 긴편이다."
    ratio3_3_a = "인중이 아주 이상적이다."
    ratio3_4_a = "인중이 짧은 편이다."
    ratio3_5_a = "인중이 매우 짧다."
    
    # ratio3_1_b = "긴 인중을 가진 사람은 인간성이 좋고 장수하는 운도 풍족하다. 만약 물질적으로 풍족하지 않아도 인품으로 부터 평가되는 것이 많을 것이다. 자신의 노력 이상의 힘이나 평가를 받는다. 자녀운도 끌어 당긴다."
    # ratio3_2_b = "긴 인중을 가진 사람은 인간성이 좋고 장수하는 운도 풍족하다. 만약 물질적으로 풍족하지 않아도 인품으로 부터 평가되는 것이 많을 것이다. 자신의 노력 이상의 힘이나 평가를 받는다. 자녀운도 끌어 당긴다."
    # ratio3_3_b = "긴 인중을 가진 사람은 인간성이 좋고 장수하는 운도 풍족하다. 만약 물질적으로 풍족하지 않아도 인품으로 부터 평가되는 것이 많을 것이다. 자신의 노력 이상의 힘이나 평가를 받는다. 자녀운도 끌어 당긴다."
    # ratio3_4_b = "인중이 짧은 사람은 성격적으로 싫증을 잘 내고 사람과 깊게 관계하는 것을 좋아하지 않을 수 있다. 체력적으로 활기가 부족하고 일의 성과가 좋더라도 더 좋은 것은 없을까 하고 모색해 흥미가 금방 떨어지는 경향이있다. 하지만 많은 사람과 교류하면 도움을 받을 수 있는 인물이 반드시 나타나기 때문에 그런 사람과 함께 출발하여 운기를 여는것이 중요하다."
    # ratio3_5_b = "인중이 짧은 사람은 성격적으로 싫증을 잘 내고 사람과 깊게 관계하는 것을 좋아하지 않을 수 있다. 체력적으로 활기가 부족하고 일의 성과가 좋더라도 더 좋은 것은 없을까 하고 모색해 흥미가 금방 떨어지는 경향이있다. 하지만 많은 사람과 교류하면 도움을 받을 수 있는 인물이 반드시 나타나기 때문에 그런 사람과 함께 출발하여 운기를 여는것이 중요하다."
    # 긴풀이
    # ratio3_1_b = "긴 인중을 지닌 사람은 종종 인간성이 뛰어나고 장수하는 경향이 있다고 여겨집니다. 이러한 특징은 그들이 삶에서 풍부한 운을 누리는 데 기여하며, 물질적인 풍요로움과는 별개로 그들의 인품 자체가 높은 평가를 받는 중요한 요소가 됩니다. 이들은 종종 자신의 노력으로 설명할 수 없는 힘을 발휘하거나 예상치 못한 긍정적인 평가를 받는 경우가 많으며, 이는 그들의 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼치기 때문입니다. 또한, 자녀운에 있어서도 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 하며, 세대를 넘어서는 긍정적인 영향력을 발휘하는 것으로 보입니다. 이는 그들이 타인과의 관계에서도 긍정적인 영향을 미치며, 주변 사람들로부터 존중과 사랑을 받는 기반을 마련해 줍니다."
    # ratio3_2_b = "긴 인중을 지닌 사람은 종종 인간성이 뛰어나고 장수하는 경향이 있다고 여겨집니다. 이러한 특징은 그들이 삶에서 풍부한 운을 누리는 데 기여하며, 물질적인 풍요로움과는 별개로 그들의 인품 자체가 높은 평가를 받는 중요한 요소가 됩니다. 이들은 종종 자신의 노력으로 설명할 수 없는 힘을 발휘하거나 예상치 못한 긍정적인 평가를 받는 경우가 많으며, 이는 그들의 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼치기 때문입니다. 또한, 자녀운에 있어서도 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 하며, 세대를 넘어서는 긍정적인 영향력을 발휘하는 것으로 보입니다. 이는 그들이 타인과의 관계에서도 긍정적인 영향을 미치며, 주변 사람들로부터 존중과 사랑을 받는 기반을 마련해 줍니다."
    # ratio3_3_b = "긴 인중을 지닌 사람은 종종 인간성이 뛰어나고 장수하는 경향이 있다고 여겨집니다. 이러한 특징은 그들이 삶에서 풍부한 운을 누리는 데 기여하며, 물질적인 풍요로움과는 별개로 그들의 인품 자체가 높은 평가를 받는 중요한 요소가 됩니다. 이들은 종종 자신의 노력으로 설명할 수 없는 힘을 발휘하거나 예상치 못한 긍정적인 평가를 받는 경우가 많으며, 이는 그들의 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼치기 때문입니다. 또한, 자녀운에 있어서도 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 하며, 세대를 넘어서는 긍정적인 영향력을 발휘하는 것으로 보입니다. 이는 그들이 타인과의 관계에서도 긍정적인 영향을 미치며, 주변 사람들로부터 존중과 사랑을 받는 기반을 마련해 줍니다."
    # ratio3_4_b = "인중이 짧은 사람은 종종 성격적으로 변덕이 심하고 사람들과 깊은 관계를 맺는 것을 주저할 수 있습니다. 이런 특성은 체력적으로도 활기가 다소 부족하며, 일에 있어서 성과가 좋음에도 불구하고 끊임없이 더 좋은 결과를 추구하다가 흥미를 금방 잃는 경향을 보일 수 있습니다. 이러한 경향은 때로는 집중력을 유지하고 장기적인 목표를 달성하는 데 어려움을 초래할 수 있습니다. 그러나, 이들이 많은 사람들과 적극적으로 교류하며 관계를 넓혀가면, 상황을 전환시킬 수 있는 도움을 줄 수 있는 인물을 만날 가능성이 높습니다. 이는 그들이 자신의 운기를 개방하고 새로운 기회를 창출하는 데 중요한 역할을 할 수 있으며, 따라서 이러한 인물과 함께 시작하여 긍정적인 변화를 모색하는 것이 중요합니다. 이 과정에서 내면의 잠재력을 발견하고, 변화를 수용하는 태도를 개발함으로써, 그들은 자신의 한계를 뛰어넘는 성장을 경험할 수 있을 것입니다."
    # ratio3_5_b = "인중이 짧은 사람은 종종 성격적으로 변덕이 심하고 사람들과 깊은 관계를 맺는 것을 주저할 수 있습니다. 이런 특성은 체력적으로도 활기가 다소 부족하며, 일에 있어서 성과가 좋음에도 불구하고 끊임없이 더 좋은 결과를 추구하다가 흥미를 금방 잃는 경향을 보일 수 있습니다. 이러한 경향은 때로는 집중력을 유지하고 장기적인 목표를 달성하는 데 어려움을 초래할 수 있습니다. 그러나, 이들이 많은 사람들과 적극적으로 교류하며 관계를 넓혀가면, 상황을 전환시킬 수 있는 도움을 줄 수 있는 인물을 만날 가능성이 높습니다. 이는 그들이 자신의 운기를 개방하고 새로운 기회를 창출하는 데 중요한 역할을 할 수 있으며, 따라서 이러한 인물과 함께 시작하여 긍정적인 변화를 모색하는 것이 중요합니다. 이 과정에서 내면의 잠재력을 발견하고, 변화를 수용하는 태도를 개발함으로써, 그들은 자신의 한계를 뛰어넘는 성장을 경험할 수 있을 것입니다."
    ratio3_1_b = "긴 인중을 지닌 사람은 종종 인간성이 뛰어나고 장수하는 경향이 있다고 여겨집니다. 이러한 특징은 그들이 삶에서 풍부한 운을 누리는 데 기여하며, 물질적인 풍요로움과는 별개로 그들의 인품 자체가 높은 평가를 받는 중요한 요소가 됩니다."
    ratio3_2_b = "종종 자신의 노력으로 설명할 수 없는 힘을 발휘하거나 예상치 못한 긍정적인 평가를 받는 경우가 많으며, 이는 그들의 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼치기 때문입니다."
    ratio3_3_b = "자녀운에 있어서도 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 하며, 세대를 넘어서는 긍정적인 영향력을 발휘하는 것으로 보입니다. 이는 그들이 타인과의 관계에서도 긍정적인 영향을 미치며, 주변 사람들로부터 존중과 사랑을 받는 기반을 마련해 줍니다."
    ratio3_4_b = "인중이 짧은 사람은 종종 성격적으로 변덕이 심하고 사람들과 깊은 관계를 맺는 것을 주저할 수 있습니다. 이런 특성은 체력적으로도 활기가 다소 부족하며, 일에 있어서 성과가 좋음에도 불구하고 끊임없이 더 좋은 결과를 추구하다가 흥미를 금방 잃는 경향을 보일 수 있습니다."
    ratio3_5_b = "때로는 집중력을 유지하고 장기적인 목표를 달성하는 데 어려움을 초래할 수 있습니다. 그러나, 이들이 많은 사람들과 적극적으로 교류하며 관계를 넓혀가면, 상황을 전환시킬 수 있는 도움을 줄 수 있는 인물을 만날 가능성이 높습니다. 이는 그들이 자신의 운기를 개방하고 새로운 기회를 창출하는 데 중요한 역할을 할 수 있으며, 따라서 이러한 인물과 함께 시작하여 긍정적인 변화를 모색하는 것이 중요합니다."

    if ratio3 > 0.7:
        ratio3a = ratio3_1_a
        ratio3b = ratio3_1_b
        facescore += r1_old*5
        r1 += r1_old*5
        r1_old_sum += r1_old*5

        facescore += r2_love*5
        r2 += r2_love*5
        r2_love_sum += r2_love*5

        facescore += r4_since*5
        r4 += r4_since*5
        r4_since_sum += r4_since*5
    elif ratio3 <= 0.7 and ratio3 > 0.65:
        ratio3a = ratio3_2_a
        ratio3b = ratio3_2_b
        facescore += r1_old*5
        r1 += r1_old*5
        r1_old_sum += r1_old*5

        facescore += r2_love*5
        r2 += r2_love*5
        r2_love_sum += r2_love*5

        facescore += r4_since*5
        r4 += r4_since*5
        r4_since_sum += r4_since*5
    elif ratio3 <= 0.65 and ratio3 > 0.58:
        ratio3a = ratio3_3_a
        ratio3b = ratio3_3_b
        facescore += r1_old*5
        r1 += r1_old*5
        r1_old_sum += r1_old*5

        facescore += r2_love*5
        r2 += r2_love*5
        r2_love_sum += r2_love*5

        facescore += r4_since*5
        r4 += r4_since*5
        r4_since_sum += r4_since*5
    elif ratio3 <= 0.58 and ratio3 > 0.5:
        ratio3a = ratio3_4_a
        ratio3b = ratio3_4_b
        facescore += r1_power*2
        r1 += r1_power*2
        r1_power_sum += r1_power*2

        facescore += r3_social*2
        r3 += r3_social*2
        r3_social_sum += r3_social*2

        facescore += r4_since*1
        r4 += r4_since*1
        r4_since_sum += r4_since*1

    else:
        ratio3a = ratio3_5_a
        ratio3b = ratio3_5_b
        facescore += r1_power*2
        r1 += r1_power*2
        r1_power_sum += r1_power*2

        facescore += r3_social*2
        r3 += r3_social*2
        r3_social_sum += r3_social*2

        facescore += r4_since*1
        r4 += r4_since*1
        r4_since_sum += r4_since*1
    # print(ratio3a)
    # print(ratio3b)
    #턱길이    
    ratio4_1_a = "턱이 엄청 길다."
    ratio4_2_a = "턱이 긴편이다."
    ratio4_3_a = "턱이 아주 이상적이다."
    ratio4_4_a = "턱이 짧은 편이다."
    ratio4_5_a = "턱이 짧은 편이다."
    
    ratio4_1_b = "턱이 엄청 길다턱이 엄청 길다턱이 엄청 길다턱이 엄청 길다. "
    ratio4_2_b = "턱이 긴편이다턱이 긴편이다턱이 긴편이다턱이 긴편이다턱이 긴편이다턱이 긴편이다."
    ratio4_3_b = "턱이 아주 이상적이다턱이 아주 이상적이다턱이 아주 이상적이다."
    ratio4_4_b = "턱이 짧은 편이다턱이 짧은 편이다턱이 짧은 편이다턱이 짧은 편이다턱이 짧은 편이다."
    ratio4_5_b = "턱이 짧은 편이다턱이 짧은 편이다턱이 짧은 편이다턱이 짧은 편이다."

    if ratio4 > 1.5:
        ratio4a = ratio4_1_a
        ratio4b = ratio4_1_b
        # facescore += 1
    elif ratio4 <= 1.5 and ratio4 > 1.2:
        ratio4a = ratio4_2_a
        ratio4b = ratio4_2_b
        # facescore += 2
    elif ratio4 <= 1.2 and ratio4 > 0.8:
        ratio4a = ratio4_3_a
        ratio4b = ratio4_3_b
        # facescore += 3
    elif ratio4 <= 0.8 and ratio4 > 0.6:
        ratio4a = ratio4_4_a
        ratio4b = ratio4_4_b
        # facescore += 2
    else:
        ratio4a = ratio4_5_a
        ratio4b = ratio4_5_b
        # facescore += 1
    # print(ratio4a)
    # print(ratio4b)

    #입길이    
    ratio7_1_a = "입이 엄청 길다."
    ratio7_2_a = "입이 긴편이다."
    ratio7_3_a = "입이 아주 이상적이다."
    ratio7_4_a = "입이 짧은 편이다."
    ratio7_5_a = "입이 엄청 작다."
    
    # ratio7_1_b = "모든 사람을 이끌어 가는 성격, 사회적으로 성공을 거두는 인상으로, 운기와 생명의 에너지를 발산시키고 있는 사람이다. 주위의 존경을 받는 존재가 될것임. 성실히고, 헌신적, 인정이 많은 면도 있어 일적인 면에서 부하나 동료가 좋아한다."
    # ratio7_2_b = "모든 사람을 이끌어 가는 성격, 사회적으로 성공을 거두는 인상으로, 운기와 생명의 에너지를 발산시키고 있는 사람이다. 주위의 존경을 받는 존재가 될것임. 성실히고, 헌신적, 인정이 많은 면도 있어 일적인 면에서 부하나 동료가 좋아한다."
    # ratio7_3_b = "모든 사람을 이끌어 가는 성격, 사회적으로 성공을 거두는 인상으로, 운기와 생명의 에너지를 발산시키고 있는 사람이다. 주위의 존경을 받는 존재가 될것임. 성실히고, 헌신적, 인정이 많은 면도 있어 일적인 면에서 부하나 동료가 좋아한다."
    # ratio7_4_b = "눈치가 빠르고 성과를 잘 올리는 타입. 조직의 넘버1 보다 넘버 2가 맞는 경우가 많다. 매우 상냔한 성격이기도 해서 높은 직위를 보좌하는 역할로 서포트하는 것이 특기임"
    # ratio7_5_b = "눈치가 빠르고 성과를 잘 올리는 타입. 조직의 넘버1 보다 넘버 2가 맞는 경우가 많다. 매우 상냔한 성격이기도 해서 높은 직위를 보좌하는 역할로 서포트하는 것이 특기임"
    ratio7_1_b = "타고난 리더십과 인상적인 카리스마로 모두를 이끌어가는 성격을 지니고 있으며, 사회적으로도 큰 성공을 거두는 모습을 보여줍니다."
    ratio7_2_b = "주변에 운기와 생명력이 넘치는 에너지를 발산하며, 이러한 긍정적인 영향력으로 인해 주위 사람들로부터 깊은 존경을 받는 존재가 됩니다. 성실함, 헌신적인 태도, 그리고 인정 많은 성격은 업무 환경에서 특히 빛을 발합니다."
    ratio7_3_b = "부하 직원이나 동료들 사이에서 매우 인기가 있습니다. 이러한 인물은 자신과 주변 사람들에게 긍정적인 변화를 가져오며, 리더십 아래에서는 모두가 함께 성장하고 발전하는 기회를 갖게 됩니다. 진정성과 노력은 그가 어떤 분야에서든 성공의 정점을 찍을 수 있도록 만들며, 삶과 경력은 많은 이들에게 영감을 주는 사례가 될 것입니다."
    ratio7_4_b = "뛰어난 직관력과 빠른 판단력으로 성과를 창출하는 데 탁월한 능력을 지니고 있습니다. 조직 내에서 최전선의 리더보다는, 전략적인 조언자나 중요한 보조 역할을 맡는 것이 더 적합한 경우가 많습니다."
    ratio7_5_b = "성격은 매우 상냥하며, 이로 인해 높은 직위에 있는 인물들을 보좌하고 서포트하는 데에 특별한 재능을 보입니다. 이런 유형의 인물은 조직의 성공에 있어서 빼놓을 수 없는 중추적인 역할을 하며, 능력과 헌신은 종종 조직의 안정성과 발전에 필수적인 기여를 합니다."

    if ratio7 > 1.75:
        ratio7a = ratio7_1_a
        ratio7b = ratio7_1_b
        facescore += r1_power*5
        r1 += r1_power*5
        r1_power_sum += r1_power*5

        facescore += r3_work*5
        r3 += r3_work*5
        r3_work_sum += r3_work*5

    elif ratio7 <= 1.75 and ratio7 > 1.65:
        ratio7a = ratio7_2_a
        ratio7b = ratio7_2_b
        facescore += r1_power*5
        r1 += r1_power*5
        r1_power_sum += r1_power*5

        facescore += r3_work*5
        r3 += r3_work*5
        r3_work_sum += r3_work*5

    elif ratio7 <= 1.65 and ratio7 > 1.57:
        ratio7a = ratio7_3_a
        ratio7b = ratio7_3_b
        facescore += r1_power*5
        r1 += r1_power*5
        r1_power_sum += r1_power*5

        facescore += r3_work*5
        r3 += r3_work*5
        r3_work_sum += r3_work*5

    elif ratio7 <= 1.57 and ratio7 > 1.45:
        ratio7a = ratio7_4_a
        ratio7b = ratio7_4_b
        facescore += r1_power*3
        r1 += r1_power*3
        r1_power_sum += r1_power*3

        facescore += r3_work*3
        r3 += r3_work*3
        r3_work_sum += r3_work*3

    else:
        ratio7a = ratio7_5_a
        ratio7b = ratio7_5_b
        facescore += r1_power*3
        r1 += r1_power*3
        r1_power_sum += r1_power*3

        facescore += r3_work*3
        r3 += r3_work*3
        r3_work_sum += r3_work*3

    # print(ratio7a)
    # print(ratio7b)

    #하관    
    ratio8_1_a = "하관이 매우 튼튼하다."
    ratio8_2_a = "하관이 튼튼하다."
    ratio8_3_a = "하관이 아주 이상적이다."
    ratio8_4_a = "턱이 얇은 편이다."
    ratio8_5_a = "턱이 매우 뾰족하다."
    
    # ratio8_1_b = "말년에 재복과 자식덕이 있고 풍요롭다. "
    # ratio8_2_b = "말년에 재복과 자식덕이 있고 풍요롭다. "
    # ratio8_3_b = "말년에 재복과 자식덕이 있고 풍요롭다. "
    # ratio8_4_b = "말년에 재복과 자식덕이 없고 늦게까지 고생한다. 하지만 열심히 살면 자수성가의 삶을 산다."
    # ratio8_5_b = "말년에 재복과 자식덕이 없고 늦게까지 고생한다. 하지만 열심히 살면 자수성가의 삶을 산다."
    ratio8_1_b = "말년에 재물과 자녀의 복으로 큰 풍요를 누릴 예정입니다. 삶의 후반기가 되어서는 안정적인 재정 상태와 자식들의 성공 덕분에 편안하고 충족된 삶을 즐길 수 있게 됩니다."
    ratio8_2_b = "말년에 재물과 자녀의 복으로 큰 풍요를 누릴 예정입니다. 삶의 후반기가 되어서는 안정적인 재정 상태와 자식들의 성공 덕분에 편안하고 충족된 삶을 즐길 수 있게 됩니다."
    ratio8_3_b = "말년에 재물과 자녀의 복으로 큰 풍요를 누릴 예정입니다. 삶의 후반기가 되어서는 안정적인 재정 상태와 자식들의 성공 덕분에 편안하고 충족된 삶을 즐길 수 있게 됩니다."
    ratio8_4_b = "말년에 재물운과 자식의 도움이 부족해 어려움을 겪을 수 있으나, 끊임없는 노력으로 자수성가의 길을 걷게 됩니다. 꾸준한 열정과 헌신은 결국 성공과 만족을 가져올 것입니다."
    ratio8_5_b = "말년에 재물운과 자식의 도움이 부족해 어려움을 겪을 수 있으나, 끊임없는 노력으로 자수성가의 길을 걷게 됩니다. 꾸준한 열정과 헌신은 결국 성공과 만족을 가져올 것입니다."

    if ratio8 > 0.78:
        ratio8a = ratio8_1_a
        ratio8b = ratio8_1_b
        facescore += r2_adult*5
        r2 += r2_adult*5
        r2_adult_sum += r2_adult*5

        facescore += r3_social*5
        r3 += r3_social*5
        r3_social_sum += r3_social*5

    elif ratio8 <= 0.78 and ratio8 > 0.77:
        ratio8a = ratio8_2_a
        ratio8b = ratio8_2_b
        facescore += r2_adult*5
        r2 += r2_adult*5
        r2_adult_sum += r2_adult*5

        facescore += r3_social*5
        r3 += r3_social*5
        r3_social_sum += r3_social*5

    elif ratio8 <= 0.77 and ratio8 > 0.76:
        ratio8a = ratio8_3_a
        ratio8b = ratio8_3_b
        facescore += r2_adult*5
        r2 += r2_adult*5
        r2_adult_sum += r2_adult*5

        facescore += r3_social*5
        r3 += r3_social*5
        r3_social_sum += r3_social*5

    elif ratio8 <= 0.76 and ratio8 > 0.75:
        ratio8a = ratio8_4_a
        ratio8b = ratio8_4_b
        facescore += r2_adult*1
        r2 += r2_adult*1
        r2_adult_sum += r2_adult*1

        facescore += r3_social*1
        r3 += r3_social*1
        r3_social_sum += r3_social*1

    else:
        ratio8a = ratio8_5_a
        ratio8b = ratio8_5_b
        facescore += r2_adult*1
        r2 += r2_adult*1
        r2_adult_sum += r2_adult*1

        facescore += r3_social*1
        r3 += r3_social*1
        r3_social_sum += r3_social*1

    # print(ratio8a)
    # print(ratio8b)


    print("##########해석############")

    #print("vertice1==",vertice1)


    ellipse_size = int(ylenth/65)
    # 눈크기 제기
    eyelenth = float(facepoint[1].x)-float(facepoint[0].x)

    eyesizeleftx = float(facepoint[17].x)-float(facepoint[19].x)
    eyesizelefty = float(facepoint[18].y)-float(facepoint[16].y)
    eyesizerightx = float(facepoint[21].x)-float(facepoint[23].x)
    eyesizerighty = float(facepoint[22].y)-float(facepoint[20].y)

    # 입크기 제기
    mouthsizex = float(facepoint[11].x)-float(facepoint[10].x)
    mouthtopsize = float(facepoint[12].y)-float(facepoint[8].y)
    mouthbottomsize = float(facepoint[9].y)-float(facepoint[12].y)
    mouthsizey = float(facepoint[9].y)-float(facepoint[8].y)
    # 부위별 crob & save
    # 왼쪽눈
    eyebrows = (facepoint[0].y-facepoint[2].y)*2+facepoint[2].y-facepoint[24].y
    eyebrowwidth = facepoint[3].x-facepoint[2].x
    eyewidth = facepoint[17].x-facepoint[19].x
    eyeheight = facepoint[18].y-facepoint[16].y
    #print('eyeborws',eyebrows)
    #print('eyebrowwidth',eyebrowwidth)
    if facepoint[2].x <= facepoint[19].x:
        crop_img = pillow_img.crop((facepoint[2].x-ellipse_size*2,facepoint[24].y-ellipse_size*2,facepoint[2].x+eyebrowwidth+ellipse_size*2,facepoint[24].y+eyebrows+ellipse_size*2))
    else:
        crop_img = pillow_img.crop((facepoint[19].x-ellipse_size,facepoint[16].y-ellipse_size,facepoint[19].x+eyewidth+ellipse_size,facepoint[16].y+eyeheight+ellipse_size))
    #crop_img = pillow_img.crop((facepoint[2].x-ellipse_size*4,facepoint[2].y-ellipse_size*4,facepoint[2].x+ellipse_size*14,facepoint[2].y+ellipse_size*14))
    filessname = lefteyename  
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER'], filessname))
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER2'], filessname))
    # 오른쪽눈
    crop_img = pillow_img.crop((facepoint[4].x-ellipse_size*3,facepoint[4].y-ellipse_size*4,facepoint[4].x+ellipse_size*15,facepoint[4].y+ellipse_size*14))
    filessname = righteyename
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER'], filessname))
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER2'], filessname))
    
    # 코
    if facepoint[18].y > facepoint[22].y:
        downeye = facepoint[18].y
    elif facepoint[18].y <= facepoint[22].y:
        downeye = facepoint[22].y
    liptop = facepoint[8].y-facepoint[6].y
    eyelow = downeye-facepoint[6].y
    nosesizeh = (facepoint[13].x-facepoint[14].x)/2
    
    crop_img = pillow_img.crop((facepoint[6].x-nosesizeh-ellipse_size*3,facepoint[6].y+eyelow,facepoint[6].x+nosesizeh+ellipse_size*3,facepoint[6].y+liptop))
    #일립스 버전 crop_img = pillow_img.crop((facepoint[6].x-ellipse_size*7,facepoint[6].y+ellipse_size*2,facepoint[6].x+ellipse_size*8,facepoint[6].y+ellipse_size*17))
    filessname = nosename
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER'], filessname))
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER2'], filessname))
    # 입
    crop_img = pillow_img.crop((facepoint[10].x-ellipse_size*2,facepoint[8].y-ellipse_size*2,facepoint[10].x+mouthsizex+ellipse_size*2,facepoint[8].y+mouthsizey+ellipse_size*2))
    #일립스 버전crop_img = pillow_img.crop((facepoint[12].x-ellipse_size*10,facepoint[12].y-ellipse_size*6,facepoint[12].x+ellipse_size*10,facepoint[12].y+ellipse_size*8))
    filessname = mouthname
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER'], filessname))
    crop_img.save(os.path.join(app.config['UPLOAD_FOLDER2'], filessname))
    # 점찍기
    ellipse_size = int(ylenth/90)
    for i in range(len(facepoint) ):
        # 점에 숫자 쓰기 draw.text((facepoint[i].x-ellipse_size, facepoint[i].y-ellipse_size),str(i),(0,0,0))
        draw.ellipse((facepoint[i].x-ellipse_size, facepoint[i].y-ellipse_size, facepoint[i].x+ellipse_size, facepoint[i].y+ellipse_size), fill=(255,255,255,80),outline='green')
    


    
    # draw.ellipse((vertices[0].x, vertices[0].y,vertices[0].x+ellipse_size,vertices[0].y+ellipse_size), fill=(255,255,255,125), outline='white')
    # for i in range(len(facepoint) -1):
    #     draw.ellipse((facepoint[i].x, facepoint[i].y, facepoint[i].x+ellipse_size, facepoint[i].y+ellipse_size))

# 11111111111111
    # 1비율기준(코 넓이로 활용함)
    faceratio = float(facepoint[17].x)-float(facepoint[19].x)
    faceratio = 1000/faceratio
    print("내 비율기준",faceratio)

    #눈안쪽 길이
    eyeinwidth = facepoint[23].x-facepoint[17].x
    print('눈안쪽 길이', eyeinwidth)
    #눈동자 사이거리
    #eyelenth
    #눈동자 안쪽사이 값
    eyemidwidth = ((facepoint[1].x-facepoint[23].x)/2+facepoint[23].x)-((facepoint[17].x-facepoint[0].x)/2+facepoint[0].x)
    # b1spot = aangle*float(facepoint[23].x)+float(facepoin

    # print('눈동자 안쪽사이 값',eyemidwidth)
    #눈동자 사이거리
    # print("눈동자 사이거리",eyelenth)
    #눈크기
    # print("왼쪽눈 크기 x축 & y축",eyesizeleftx,"&",eyesizelefty)
    # print("오른쪽눈 크기 x축 & y축",eyesizerightx,"&",eyesizerighty)
    size01 = float(round(((eyesizeleftx-eyesizerightx)/faceratio), 2))
    size02 = float(round(((eyesizerightx-eyesizeleftx)/faceratio), 2))
    size03 = float(round(((eyesizelefty-eyesizerighty)/faceratio), 2))
    size04 = float(round(((eyesizerighty-eyesizelefty)/faceratio), 2))
    if eyesizeleftx > eyesizerightx:
        print("왼쪽눈이",size01,'mm 더 길다')
    else:
        print("오른쪽눈이",size02,'mm 더 길다')
    if eyesizelefty > eyesizerighty:
        print("왼쪽눈이",size03,'mm 더 크다')
    else:
        print("오른쪽눈이",size04,'mm 더 크다')
    #얼굴 특징 확정
    # print("얼굴 부위별 특징 확정!!!")
    
    #눈 크기 판별
    # print("눈크기 판별!")
    eyeratio = eyesizeleftx/eyesizelefty
    eyefaceratio = (facepoint[27].x-facepoint[26].x)/eyewidth
    # print("눈길이 비율💛 : ",eyefaceratio,"@",eyeratio)
    if eyefaceratio < 5.33:
        if eyeratio > 3.5:
            youreye = "눈이 아주 작은편"
            # youreyeb = "뭔가 결정을 내릴 때 천천히 잘 생각하고 나서 행동합니다. 경계심이 강하고 쉽게 사람을 믿지 않습니다. 한 번 결정하면 의지가 굳어 고집스럽다. 타고난 환경은 불우하거나 젊은 시절에 고생을 하는 사람도 있지만 꾸준히 노력하여 성공하는 타입. 질투심이 강한 일면도 있다."
            youreyeb = "결정을 내릴 때 신중함을 기하며, 모든 가능성을 고려한 뒤 행동으로 옮깁니다. 자연스럽게 경계심이 강해 사람을 쉽게 신뢰하지 않으며, 일단 결정을 내리면 그 의지는 굳건해져 변화를 꺼리는 고집스러운 면모를 보입니다."
            facescore += r2_sprit*4
            r2_sprit_sum += r2_sprit*4

            facescore += r2_jeal*3
            r2_jeal_sum += r2_jeal*3

            facescore += r3_someone*3
            r3_someone_sum += r3_someone*3

            facescore += r4_kind*4
            r4_kind_sum += r4_kind*4

        elif eyeratio>3.2 and eyeratio <=3.5:
            youreye = "눈이 작은편"
            # youreyeb = "뭔가 결정을 내릴 때 천천히 잘 생각하고 나서 행동합니다. 경계심이 강하고 쉽게 사람을 믿지 않습니다. 한 번 결정하면 의지가 굳어 고집스럽다. 타고난 환경은 불우하거나 젊은 시절에 고생을 하는 사람도 있지만 꾸준히 노력하여 성공하는 타입. 질투심이 강한 일면도 있다."
            youreyeb = "어려운 환경에서 자랐거나 젊은 시절 고난을 겪었음에도 불구하고, 그는 끊임없는 노력으로 성공의 길을 걷는 인물입니다. 이러한 과정 속에서 강한 질투심을 발휘하기도 하지만, 이는 그가 자신의 목표에 더욱 집중하고 성취를 위해 힘쓰게 하는 원동력이 됩니다."
            facescore += r2_sprit*4
            r2_sprit_sum += r2_sprit*4

            facescore += r2_jeal*3
            r2_jeal_sum += r2_jeal*3

            facescore += r3_someone*3
            r3_someone_sum += r3_someone*3

            facescore += r4_kind*4
            r4_kind_sum += r4_kind*4

        elif eyeratio>2.5 and eyeratio <=3.2:
            youreye = "눈이 큰편"
            # youreyeb = "호기심이 왕성하고 표현력이 풍부하다. 재빠르고 행동력도 좋아 시야가 넓기 때문에 대담한 조치를 취할 수  있다. 다른 사람이나 그 자리의 상황을 잘 관찰하고 협조성도 좋아 주위 사람들에 대한 배려심이 있습니다. 눈빛이 날카롭게 위압감이 있는 큰 눈의 경우 리더십이 좋고 고생을 아랑곳하지 않고 견디는 힘을 가지고 있어 경영자나 정치인에 적합합니다. 또한 다른 사람의 평가를 궁금해하거나 불안해 하는 경향이 있다."
            youreyeb = "호기심이 매우 강하고, 생생한 표현력을 지녔습니다. 빠른 사고와 행동력을 바탕으로 넓은 시야를 가지고 있어, 상황에 따라 대담한 조치를 취하는 능력이 뛰어납니다. 주변 사람이나 상황을 세심하게 관찰하며, 협조적 태도와 배려심으로 주위 사람들과의 관계에서 긍정적인 영향을 미칩니다."
            facescore += r2_sprit*1
            r2_sprit_sum += r2_sprit*1

            facescore += r2_jeal*5
            r2_jeal_sum += r2_jeal*5

            facescore += r3_someone*1
            r3_someone_sum += r3_someone*1

            facescore += r4_kind*1
            r4_kind_sum += r4_kind*1

        elif eyeratio <=2.5:
            youreye = "눈이 아주 큰편"
            # youreyeb = "호기심이 왕성하고 표현력이 풍부하다. 재빠르고 행동력도 좋아 시야가 넓기 때문에 대담한 조치를 취할 수  있다. 다른 사람이나 그 자리의 상황을 잘 관찰하고 협조성도 좋아 주위 사람들에 대한 배려심이 있습니다. 눈빛이 날카롭게 위압감이 있는 큰 눈의 경우 리더십이 좋고 고생을 아랑곳하지 않고 견디는 힘을 가지고 있어 경영자나 정치인에 적합합니다. 또한 다른 사람의 평가를 궁금해하거나 불안해 하는 경향이 있다."
            youreyeb = "날카로운 눈빛과 큰 눈을 가진 이 인물은 자연스러운 리더십을 발휘하며, 어려움을 극복하는 강인한 정신력을 가지고 있어, 경영이나 정치 분야에서 뛰어난 역할을 할 수 있습니다. 그러나 타인의 평가에 대한 궁금증이나 불안함을 종종 느끼는 경향이 있어, 이러한 감정을 관리하는 것이 중요합니다."
            facescore += r2_sprit*1
            r2_sprit_sum += r2_sprit*1

            facescore += r2_jeal*5
            r2_jeal_sum += r2_jeal*5

            facescore += r3_someone*1
            r3_someone_sum += r3_someone*1

            facescore += r4_kind*1
            r4_kind_sum += r4_kind*1
    else:
        if eyeratio > 3.5:
            youreye = "눈이 아주 작고 긴편"
            # youreyeb = "순수한 마음의 소유자로 흔히 볼 수 있지만. 반면 사람을 너무 믿기 쉬운 인상도 있다. 사회생활을 잘하는 성격으로 회사 조직 방향에 꾸준한 활동을 계속하여 주위의 도움으로 성공할 수 있다. 의지할 사람이 나타나면 의존하는 경향이 있다. 다정하게 연애를 하기 쉽다. 감수성이 풍부하고 부드러움이 넘치며 처세를 잘하는 성격, 사람의 기분을 잘 맞춰줌. 소중한 사람을 위해서라면 상식에서 벗어난 행동도 자신을 희생하여 해내는 대담함이 있다."
            youreyeb = "순수한 마음으로 사람들을 믿지만, 때로 너무 믿음을 줘서 조심해야 합니다. 사회 생활에서는 능숙하게 행동하며 조직의 성장을 위해 힘쓰며 주변 도움을 활용해 성공을 이룰 수 있습니다. 그러나 의존적인 경향을 조절하는 것이 필요합니다"
            facescore += r2_sprit*3
            r2_sprit_sum += r2_sprit*3

            facescore += r2_jeal*3
            r2_jeal_sum += r2_jeal*3

            facescore += r3_someone*3
            r3_someone_sum += r3_someone*3

            facescore += r4_kind*5
            r4_kind_sum += r4_kind*5
            
        elif eyeratio>3.2 and eyeratio <=3.5:
            youreye = "눈이 작고 긴편"
            # youreyeb = "순수한 마음의 소유자로 흔히 볼 수 있지만. 반면 사람을 너무 믿기 쉬운 인상도 있다. 사회생활을 잘하는 성격으로 회사 조직 방향에 꾸준한 활동을 계속하여 주위의 도움으로 성공할 수 있다. 의지할 사람이 나타나면 의존하는 경향이 있다. 다정하게 연애를 하기 쉽다. 감수성이 풍부하고 부드러움이 넘치며 처세를 잘하는 성격, 사람의 기분을 잘 맞춰줌. 소중한 사람을 위해서라면 상식에서 벗어난 행동도 자신을 희생하여 해내는 대담함이 있다."
            youreyeb = "연애에선 따뜻하고 다정한 모습을 보이며 상대방의 감수성을 잘 이해합니다. 또한 감수성이 풍부하고 유연한 성격으로, 사람들과 원활한 관계를 유지하고 소중한 사람을 위해 대담한 희생도 감행할 수 있습니다.조언: 믿음을 조심하며 독립성을 유지하고 의지를 줄이는 데 노력하며, 다른 사람들의 감정을 존중하고 이해하는 데 주력하세요."
            facescore += r2_sprit*3
            r2_sprit_sum += r2_sprit*3

            facescore += r2_jeal*3
            r2_jeal_sum += r2_jeal*3

            facescore += r3_someone*3
            r3_someone_sum += r3_someone*3

            facescore += r4_kind*5
            r4_kind_sum += r4_kind*5
        elif eyeratio>2.5 and eyeratio <=3.2:
            youreye = "눈이 그냥 보통의 눈"
            # youreyeb = "호기심이 왕성하고 표현력이 풍부하다. 재빠르고 행동력도 좋아 시야가 넓기 때문에 대담한 조치를 취할 수  있다. 다른 사람이나 그 자리의 상황을 잘 관찰하고 협조성도 좋아 주위 사람들에 대한 배려심이 있습니다. 눈빛이 날카롭게 위압감이 있는 큰 눈의 경우 리더십이 좋고 고생을 아랑곳하지 않고 견디는 힘을 가지고 있어 경영자나 정치인에 적합합니다. 또한 다른 사람의 평가를 궁금해하거나 불안해 하는 경향이 있다."
            youreyeb = "호기심이 왕성하고 표현력이 풍부한 성격으로, 빠른 판단력과 대담한 행동력을 가지고 있습니다. 주변을 주의 깊게 관찰하며 협조적이며 배려심 있는 성격으로, 사람들과 원활한 관계를 유지합니다."
            facescore += r2_sprit*1
            r2_sprit_sum += r2_sprit*1
            facescore += r2_jeal*1
            r2_jeal_sum += r2_jeal*1
            facescore += r3_work*5
            r3_work_sum += r3_work*5
            facescore += r3_someone*1
            r3_someone_sum += r3_someone*1
            facescore += r4_kind*1
            r4_kind_sum += r4_kind*1
        elif eyeratio <=2.5:
            youreye = "눈이 작지만 둥근편"
            # youreyeb = "뭔가 결정을 내릴 때 천천히 잘 생각하고 나서 행동합니다. 경계심이 강하고 쉽게 사람을 믿지 않습니다. 한 번 결정하면 의지가 굳어 고집스럽다. 타고난 환경은 불우하거나 젊은 시절에 고생을 하는 사람도 있지만 꾸준히 노력하여 성공하는 타입. 질투심이 강한 일면도 있다."
            youreyeb = "질투심이 강한 면도 있어 다른 사람들과의 관계에서 조심해야 합니다. 조언으로는 더욱 신중하게 판단하고 타인과의 대화와 관계에서 열린 마음을 가지려 노력하면 자신의 성공과 인간관계 개선에 도움이 될 것입니다."
            facescore += r2_sprit*4
            r2_sprit_sum += r2_sprit*4
            facescore += r2_jeal*3
            r2_jeal_sum += r2_jeal*3
            facescore += r3_someone*3
            r3_someone_sum += r3_someone*3
            facescore += r4_kind*4
            r4_kind_sum += r4_kind*4
    # print("눈과 얼굴의 비율",eyefaceratio)
    # print("눈 가로세로 비율",eyeratio)
    # print("당신의 눈 :", youreye)
    
    #1) 코 길이
    noseratio = (facepoint[15].y-facepoint[6].y)/(facepoint[8].y-facepoint[15].y)
    if noseratio < 3.5:
        yournoselen = "코가 짧은편"
    else :
        yournoselen = "코가 긴편"
    # print("noseratio",noseratio)
    # print("당신의 코 :",yournoselen)

    #2) 입 크기
    if mouthsizex < eyeinwidth:
        yourmouse = "입이 아주작은편"
    elif mouthsizex >= eyeinwidth and  mouthsizex < eyemidwidth:
        yourmouse = "입이 작은편"
    elif mouthsizex >= eyemidwidth and mouthsizex < eyelenth:
        yourmouse = "입이 큰편"
    else:
        yourmouse = "입이 아주큰편"
    # print("당신의 입 크기 :",yourmouse)
    
    #3) 입술
    mouthratio = mouthbottomsize/mouthtopsize
    if mouthratio >= 1:
        lipratio = "아래입술이 더 두꺼워요"
    else:
        lipratio = "윗입술이 더 두꺼워요"
    # print("입술은 :",lipratio)

    ############# 원형 자르기 SNS 공유용
    # 1.원형 마스크 생성
    circleimg = pillow_img
    # if circleimg.mode != 'RGBA':
    #     circleimg = circleimg.convert('RGBA')
    try:
        # 이미지의 크기 구하기
        

        # 원형 이미지확대
        # llenth = (facepoint[29].y-facepoint[6].y)*0.92
        # circleimg = circleimg.crop((facepoint[7].x-llenth, (facepoint[7].y+(facepoint[6].y-facepoint[7].y)/2)-llenth, facepoint[7].x+llenth, (facepoint[7].y+(facepoint[6].y-facepoint[7].y)/2)+llenth))
        # print("####원 시작점####",vertices[0].x, vertices[0].y)
        # print("####원 넓이####",fd_line[1].x-fd_line[0].x)


        # 500x500 리사이즈
        print("@@@@@@@@",circleimg.size)
        
        resized_img = circleimg.resize((450, 450))

        # 원형 마스크 생성
        mask = Image.new('L', resized_img.size, 0)
        drawMask = ImageDraw.Draw(mask)
        drawMask.ellipse((0, 0, resized_img.width, resized_img.height), fill=255,outline ='white')

        # 마스크 적용하여 원형 형태로 이미지 가져오기
        circular_img = Image.new('RGBA', resized_img.size)
        circular_img.paste(resized_img, (0, 0), mask)

        # 동일한 크기의 원형 마스크 생성
        border_mask = Image.new('L', resized_img.size, 0)
        drawBorderMask = ImageDraw.Draw(border_mask)
        border_thickness = 10  # 테두리 두께 설정
        border_rect = (border_thickness, border_thickness, resized_img.width - border_thickness, resized_img.height - border_thickness)
        drawBorderMask.ellipse(border_rect, fill=255)

        # 원형 마스크와 동일한 크기의 투명 빨간색 테두리 이미지 생성
        border_color = (255, 0, 0, 0)  # 빨간색 테두리 색상 설정 (RGBA) + 투명도 (128)
        border_img = Image.new('RGBA', resized_img.size, (0, 0, 0, 0))
        border_img.paste(border_color, (0, 0), border_mask)

        # 이미지와 테두리 병합
        final_img = Image.alpha_composite(circular_img, border_img)


        # 2-1 다른 이미지 열기
        # square_img = Image.open('static/shareback.png').convert('RGBA')
        # # 2-2 이미지 겹치기
        # combined_img = Image.alpha_composite(Image.new('RGBA', (500, 500), (0, 0, 0, 0)), square_img)
        # combined_img = Image.alpha_composite(combined_img, circleimg)


        # 3. 배경을 투명하게 설정하여 저장
        filename99 = "a"+filename
        # combined_img.save(os.path.join(app.config['UPLOAD_FOLDER'], filename99), format='PNG')
        # print("원6")

        ###########################################
        circle_size = 500  # 원형 크기
        canvas_size = 1080  # 캔버스 크기
        
        # 원형 이미지 생성
        # B.png 이미지 열기 및 크기 조정
        face_color = (150-(facescore-172))/149*100
        if face_color < 10:
            background_img = Image.open(current_dir+'/static/shareback1.png').convert('RGBA')
        elif face_color >=10 and face_color < 20:
            background_img = Image.open(current_dir+'/static/shareback2.png').convert('RGBA')
        elif face_color >=20 and face_color < 40:
            background_img = Image.open(current_dir+'/static/shareback3.png').convert('RGBA')
        elif face_color >=40 and face_color < 400:
            background_img = Image.open(current_dir+'/static/shareback4.png').convert('RGBA')
        else:
            background_img = Image.open(current_dir+'/static/shareback5.png').convert('RGBA')    
        background_img = background_img.resize((canvas_size, canvas_size))

        # 텍스트 추가
        draw = ImageDraw.Draw(background_img)
        text1 = "둥글둥글 참 착한 얼굴"

        if ratio8a == ratio8_2_a:
            text1 = "하관은 내가 최고지"
        if ratio8a == ratio8_1_a:
            text1 = "최고의 복덩이 내 하관"
        if ratio2a == ratio2_4_a:
            text1 = "코만 보이는 만점 짜리 코"

        if ratio3a == ratio3_2_a:
            text1 = "인중이 참 예쁘구나"
        if ratio7a == ratio7_3_a:
            text1 = "입이 참 예뿌구나"

        if ratio1a == ratio1_2_a:
            text1 = "돈을 부르는 눈두덩이"

        if ratio3a == ratio3_1_a:
            text1 = "강이 흐를법한 매력 인중"

        if eye_updown == "눈꼬리 많이 올라감":
            text1 = "눈의 기상이 하늘을 찌른다"

        if ratio1a == ratio1_1_a:
            text1 = "재물이 넘치는 눈두덩이"

        if ratio7a == ratio7_1_a:
            text1 = "모두를 현혹 시키는 내 입"

        if ratio2a == ratio2_2_a:
            text1 = "여럿 애간장 녹이는 내 코"
 

        # 변수 및 계산식을 딕셔너리에 저장
        # r1_power_sum = r1_power_sum*100/30
        # r1_old_sum = r1_old_sum*100/25-45
        # r2_sprit_sum = r2_sprit_sum*100/180
        # r2_adult_sum = r2_adult_sum*100/57
        # r2_love_sum = r2_love_sum*100/64
        # r2_jeal_sum = r2_jeal_sum*100/7
        # r3_work_sum = r3_work_sum*100/52
        # r3_social_sum = r3_social_sum*100/76
        # r3_someone_sum = r3_someone_sum*100/7
        # r3_money_sum = r3_money_sum*100/28
        # r4_kind_sum = r4_kind_sum*100/66
        # r4_wind_sum = r4_wind_sum*100/13
        # r4_respon_sum = r4_respon_sum*100/33
        # r4_since_sum = r4_since_sum*100/54
        r1_power_sum = r1_power_sum+60
        r1_old_sum = r1_old_sum+53
        r2_sprit_sum = r2_sprit_sum+3
        r2_adult_sum = r2_adult_sum+53
        r2_love_sum = r2_love_sum+40+1.1
        r2_jeal_sum = r2_jeal_sum+75
        r3_work_sum = r3_work_sum+41
        r3_social_sum = r3_social_sum+36+0.1
        r3_someone_sum = r3_someone_sum+76
        r3_money_sum = r3_money_sum+60+0.1
        r4_kind_sum = r4_kind_sum+52
        r4_wind_sum = r4_wind_sum+75+0.1
        r4_respon_sum = r4_respon_sum+66
        r4_since_sum = r4_since_sum+50+1.1

        my_all_sum = [
            ('r1_power_sum', r1_power_sum, "체력이 장군감인 상입니다."),
            ('r1_old_sum', r1_old_sum, "정말로 장수할 상입니다."),
            ('r2_sprit_sum', r2_sprit_sum, "정신력은 따라올 자가 없는 상입니다."),
            ('r2_adult_sum', r2_adult_sum, "중년에 팔자가 피는 값비싼 상입니다."),
            ('r2_love_sum', r2_love_sum, "연애 걱정 없는 연애운 최고의 상입니다."),
            ('r2_jeal_sum', r2_jeal_sum, "질투심이 있는 상입니다."),
            ('r3_work_sum', r3_work_sum, "일 하나는 똑부러지게 잘하는 상입니다."),
            ('r3_social_sum', r3_social_sum, "사회성이 만랩인 상입니다."),
            ('r3_someone_sum', r3_someone_sum, "남의 시선을 다소 신경 쓰는 상입니다."),
            ('r3_money_sum', r3_money_sum, "돈이 따라오는 상입니다."),
            ('r4_kind_sum', r4_kind_sum, "누가봐도 착한 얼굴을 가지고 있습니다."),
            ('r4_wind_sum', r4_wind_sum, "호기심이 왕성해 보이는군요."),
            ('r4_respon_sum', r4_respon_sum, "책임감이 넘쳐 흐르는 상입니다."),
            ('r4_since_sum', r4_since_sum, "성실함이 최고의 장점인 상입니다."),
        ]

        # 첫 번째 원소(숫자)를 기준으로 정렬
        sorted_tuples = sorted(my_all_sum, key=lambda x: x[1], reverse=True)

        # 가장 큰 값을 가진 변수명 찾기
        max_var_name = sorted_tuples[0][0]
        max_value1 = sorted_tuples[0][2]
        max_value2 = sorted_tuples[1][2]
        # b1spot = aangle*float(facepoint[23].x)+float(facepoin
        # 20240416 주석추가
        # for i in range(14):
        #  print(str(sorted_tuples[i][1]),"+",sorted_tuples[i][2])
        #  i += 1
        # 결과 출력
        # print(f"가장 큰 값이 있는 변수명: {max_var_name}")
        top_two_texts_combined = max_value1 +" "+ max_value2
        # print("한 줄 평", top_two_texts_combined)
        # print(my_all_sum)
        if max_var_name == "r1_power_sum":
            text3 = "내 넘치는 체력을 받아줄 강철체력"
            whytext = "힘의 기운이 가득찬 관상이오, 짝을 만날때는 내 넘치는 체력을 받아줄 강철체력이면 좋겠습니다."
        elif max_var_name == "r1_old_sum":
            text3 = "나와 함께 장수의 기운이 있는 자"
            whytext = "장수의 기운이 깃든 관상이오. 오랫동안 홀로 남아있으면 외로우니 같이 장수의 기운이 있는 상대면 좋겠습니다."
        elif max_var_name == "r2_sprit_sum":
            text3 = "애교살 만큼은 풍성하게 많은 자"
            whytext = "총명함과 정신이 깃든 관상이오. 귀한 자식을 두기 위해 애교살이 많거나 성기에 점이 있는 상대면 좋겠습니다."
        elif max_var_name == "r2_adult_sum":
            text3 = "입술이 붉으며 윤곽이 뚜렷한 자"
            whytext = "중년에 행복이 깃든 관상이오. 입술이 붉고 윤곽이 뚜렷하면 외조가 확실한 사람이 많습니다. 그런 상대면 좋겠습니다."
        elif max_var_name == "r2_love_sum":
            text3 = "항상 다정하고 소통이 잘 되는 자"
            whytext = "애정운이 충만한 관상이오. 나에 대한 애정과 관심을 늘 공유할 수 있는 다정하고 소통이 잘 되는 상대를 만나면 좋겠습니다."
        elif max_var_name == "r2_jeal_sum":
            text3 = "외모를 떠나서 정말 일편단심인 자"
            whytext = "질투심이 충만한 관상이오. 나만 바라보고 깊은 신뢰를 줄 수 있는 그런 상대를 만나면 좋겠습니다."
        elif max_var_name == "r3_work_sum":
            text3 = "본인보다 상대방을 잘 인정하는 자"
            whytext = "업무능력이 뛰어난 관상이오. 관직에 오르거나 일적으로 인정받을 수 있으니 이 또한 질투하지 않고 인정해주는 상대를 만나면 좋겠습니다."
        elif max_var_name == "r3_social_sum":
            text3 = "내 바깥활동에 이해심이 넓은 자"
            whytext = "사회성이 풍만한 관상이오. 바깥활동이 많으나 그 활동을 편하게 해주는 짝을 만나야 일이 잘 풀리고 높은 공을 세울것 입니다."
        elif max_var_name == "r3_someone_sum":
            text3 = "천상세상만상 자신감이 넘치는 자"
            whytext = "남의 시선을 다소 의식하는 관상이오. 나의 기운을 보완하거나 개선될 수 있도록 자신감이 넘치며 리드할 수 있는 상대가 좋습니다."
        elif max_var_name == "r3_money_sum":
            text3 = "돈은 내가 벌 테니 잘 관리하는 자"
            whytext = "재물이 끊임없이 들어오는 관상이오. 밑빠진 독에 물붓지 않도록 소비가 현명하며 금전적인 문제가 없는 사람을 만나면 좋겠습니다."
        elif max_var_name == "r4_kind_sum":
            text3 = "강단지며 나의 순수함 보완하는 자"
            whytext = "순수한 영혼을 가진 착한 관상이오. 나의 순수함을 보완하여 우유부단함을 해결하고 옳고 그름을 잘 따지며 결단력있는 상대면 좋겠습니다."
        elif max_var_name == "r4_wind_sum":
            text3 = "기가세고 나를 휙휙휙 휘어잡는 자"
            whytext = "호기심이 많아서 새로운사람을 궁금해하는 관상이오. 내가 쓸대없는 생각을 하지 못하도록 나를 휘어잡는 사람이 좋겠습니다."
        elif max_var_name == "r4_respon_sum":
            text3 = "성실하며 문제에 대해 이성적인 자"
            whytext = "책임감이 뛰어난 관상이오. 책임감도 남녀가 한쪽에 치우치면 기울어지는 법. 삶에 대한 책임감이 있으며 문제를 이성적으로 해결하는 사람이 좋겠습니다."
        elif max_var_name == "r4_since_sum":
            text3 = "끝까지 깊은 신뢰를 지킬수 있는 자"
            whytext = "뼈속까지 성실한 관상이오. 성실함이 남녀 한쪽에 치우치면 넘어지는 법. 같이 성실하며 서로의 신뢰를 잘 지키는 사람이 좋겠습니다."
      
        
          

        #한 줄 평 풀이 종료
        #오류!!
        text2 = "황금궁합"
        font = ImageFont.truetype(current_dir+"/static/Pretendard-Light.woff", 70)  # 원하는 폰트와 크기로 지정
        font2 = ImageFont.truetype(current_dir+"/static/Pretendard-Light.woff", 50)  # 원하는 폰트와 크기로 지정
        text4 = "황금비율"
        text5 = "상위 "+str(int(face_color))+"%"
        # 텍스트 크기 구하기
        text_size = draw.textbbox((0, 0), text1, font=font)

        # 텍스트를 이미지 중앙에 추가
        # text_position = ((canvas_size - text_size[2]) // 2, (canvas_size - text_size[3]) // 2)
        text_position1 = ((canvas_size - text_size[2]) // 2, 750)
        text_position2 = (80, 900)
        text_position3 = (320, 900)
        text_position4 = (350, 100)
        text_position5 = (550, 100)

        draw.text(text_position1, text1, font=font, fill=(255, 255, 255, 255))  # 텍스트 색상과 투명도 지정
        draw.text(text_position2, text2, font=font2, fill=(255, 255, 255, 255))  # 텍스트 색상과 투명도 지정
        draw.text(text_position3, text3, font=font2, fill=(255, 255, 255, 255))  # 텍스트 색상과 투명도 지정
        draw.text(text_position4, text4, font=font2, fill=(255, 255, 255, 255))  # 텍스트 색상과 투명도 지정
        draw.text(text_position5, text5, font=font2, fill=(255, 255, 255, 255))  # 텍스트 색상과 투명도 지정

        # 투명한 배경 생성
        background = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
        # 원형 이미지 위치 설정
        offset = ((canvas_size - final_img.width) // 2, (canvas_size - final_img.height) // 3)
        
        # 캔버스에 이미지 합성
        background.paste(final_img, offset, final_img)
        combined_img = Image.alpha_composite(background_img, background)
        # 얼굴 네모그리기
        # for i in range(len(vertices) - 1):
        #     draw.line(((vertices[i].x, vertices[i].y), (vertices[i + 1].x, vertices[i + 1].y)), fill='red', width=5)
        
        # draw.line(((vertices[len(vertices) -1].x, vertices[len(vertices) -1].y),(vertices[0].x, vertices[0].y)), fill='red', width=5)
        # #fd_line
        # for i in range(len(fd_line) - 1):
        #     draw.line(((fd_line[i].x, fd_line[i].y), (fd_line[i + 1].x, fd_line[i + 1].y)), fill=(255,0,0,100), width=5)
        
        # draw.line(((fd_line[len(fd_line) -1].x, fd_line[len(fd_line) -1].y),(fd_line[0].x, fd_line[0].y)), fill=(255,0,0,100), width=5)
        combined_img.save(os.path.join(app.config['UPLOAD_FOLDER2'], filename99), format='PNG')
        # 이미지 저장
        combined_img.save(os.path.join(app.config['UPLOAD_FOLDER'], filename99), format='PNG')

    except Exception as e:
        print("이미지 저장중 오류 : ", e)
    


    font_size = int(ylenth/8)
    font = ImageFont.truetype('./batang.ttc', font_size)
    # draw.text((vertices[0].x + 10, vertices[0].y),font=font, text="당신의 얼굴", fill='red')
    pillow_img.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    # 저장한 이미지를 다시 엽니다.
    saved_image = Image.open(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    # 이미지의 크기를 가져옵니다.
    width, height = saved_image.size
    print("width : ",width)
    print("height : ",height)

    # 가져온 이미지의 크기에 맞는 투명한 배경을 가진 새로운 이미지를 생성합니다.
    new_image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    # 원형으로 자르기 위한 마스크를 생성합니다.
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((width // 2 - radius, height // 2 - radius, width // 2 + radius, height // 2 + radius), fill=255)
    # 이미지를 원형으로 자릅니다.
    cropped_image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    cropped_image.paste(saved_image, mask=mask)
    # 원형으로 자른 이미지를 새로운 이미지의 중앙에 붙여넣습니다.
    offset = ((width - cropped_image.width) // 2, (height - cropped_image.height) // 2)
    new_image.paste(cropped_image, offset)
    
    # 최종적으로 새로운 이미지를 PNG 파일로 저장합니다.
    new_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename_dot), format="PNG")
    # file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    


    facereview.append(timekey)
    facereview.append(facecode)
    facereview.append(top_two_texts_combined)
    facereview.append(eye_updown)#눈꼬리
    facereview.append(eye_updown_read)
    facereview.append(ratio1a)#눈두덩이
    facereview.append(ratio1b)
    facereview.append(ratio2a)#코길이
    facereview.append(ratio2b)
    facereview.append("콧볼")#콧볼
    facereview.append("콧볼 해석")
    facereview.append(ratio3a)#인중길이
    facereview.append(ratio3b)
    facereview.append(ratio7a)#입크기
    facereview.append(ratio7b)
    facereview.append(ratio8a)#하관
    facereview.append(ratio8b)
    facereview.append(youreye)#눈크기
    facereview.append(youreyeb)
    facereview.append(int(face_color))
    facereview.append(selected_radio)
    facereview.append("a"+filename)
    graph_name = "b"+filename
    facereview.append(graph_name)
    facereview.append(whytext)

    import matplotlib.pyplot as plt
    from matplotlib import font_manager, rc
    import numpy as np
    # 한글 폰트 설정
    font_name = 'Malgun Gothic'  # 'NanumGothic'은 사용 가능한 폰트 중 하나로 변경 가능
    rc('font', family=font_name)

    # 스코어 점수 (최대값 100)
    # print("💛💛💛💛💛",r1,r2,r3,r4)
    r1 = r1*100/40
    r2 = r2*100/125 #원래 148 였음
    if r2 >= 125:
        r2 == 125
    r3 = r3*100/80 #원래 105 였음
    if r3 >= 80:
        r3 == 80
    r4 = r4*100/78
    r5 = (facescore*3)*100/969
    scores = [r1,r2,r3,r4,r5]
    # print("❤❤❤❤❤", scores)
    facereview.append(int(r1))
    facereview.append(int(r2))
    facereview.append(int(r3))
    facereview.append(int(r4))
    facereview.append(int(r5))

    # 각 점수에 대한 레이블 (한글)
    labels = ['물리적', '정서적', '사회적', '도적적', '잘생김']

    # 오각형의 각 꼭지점에 대한 각도 계산
    theta = np.linspace(0, 2*np.pi, len(scores), endpoint=False)

    # 오각형 그래프를 그리기 위한 subplot 생성
    fig, ax = plt.subplots(subplot_kw=dict(polar=True), figsize=(8, 8))
    fig.patch.set_facecolor('#edf4f8')  # 배경색을 흰색으로 설정

    # y축 범위를 0부터 100으로 설정
    plt.ylim(0, 100)

    # 오각형 내부를 색칠하고 투명도 조절
    ax.fill(theta, scores, color='#e5b8c1', alpha=0.8)

    # 오각형 그래프에 점수를 표시 (라인 스타일 및 마커 적용)
    ax.plot(theta, scores, 'o-', linewidth=2, markersize=5, color='#e08d9d')

    # 오각형의 꼭지점에 레이블 표시
    ax.set_xticks(theta)
    ax.set_xticklabels(labels)

    # Score1과 Score5를 잇는 선 추가 (라인 스타일 및 색상 변경)
    ax.plot([theta[0], theta[-1]], [scores[0], scores[-1]], color='#e08d9d', linewidth=2)
    # 뒷배경의 기준 선 색상을 변경
    ax.grid(color='#cfcfcf' , alpha=0.5)

    # 가장 바깥의 테두리 기준선 색상을 변경 (오렌지)
    ax.spines['polar'].set_edgecolor('#e93467')
    ax.spines['polar'].set_linewidth(3)

    # 축 눈금 텍스트 컬러를 변경
    ax.tick_params(axis='y', colors='red')  # y축 눈금 텍스트 컬러 변경

    # 범례 추가
    ax.legend()
    # 라벨 텍스트 크기 및 스타일 변경
    ax.tick_params(axis='both', labelsize=20, color='#ffffff', pad=30)  # 라벨 텍스트 크기, 색상, 거리 조절
    

    # 그래프를 이미지 파일로 저장 (확장자에 따라 이미지 형식 선택 가능)
    plt.savefig(UPLOAD_FOLDER_GRAPH+graph_name, bbox_inches='tight')

  
    return facereview
