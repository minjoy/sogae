import os, io
import time
import ssl
import asyncio
from google.cloud import vision
from draw import drawVertices
from flask import Flask, render_template, flash, request, Response, redirect, url_for, send_file, make_response, send_from_directory
import pandas as pd
import numpy as np
from werkzeug.utils import secure_filename
from datetime import datetime
from PIL import Image, ImageDraw
import pymysql
import requests, platform
import math
import cv2
import logging



#추가된 import flash, request, redirect, url_for


current_dir = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = current_dir+'/static/uploads/'
UPLOAD_FOLDER2 = current_dir+'/static/supersave/'
UPLOAD_FOLDER3 = current_dir+'/static/'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = current_dir+'/ServiceAccountToken.json'

app = Flask(__name__)
app.secret_key = "secret key"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['UPLOAD_FOLDER2'] = UPLOAD_FOLDER2
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# 로그 파일의 경로 및 파일명 설정
log_file = UPLOAD_FOLDER3+'log.txt'
# 로깅 설정
logging.basicConfig(filename=log_file, level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')
# 예시로 INFO 레벨의 로그 메시지 기록
logging.info('프로그램 시작')


#슬랙알림
def post_message(token, channel, text):
    response = requests.post("https://slack.com/api/chat.postMessage",
        headers={"Authorization": "Bearer "+token},
        data={"channel": channel,"text": text}
    )
    print(response)

#myToken = "xoxb-1661398737172-1843517804513-GFdENDf8MO4zjlgkThCyuXA1"
myToken = "xoxb-1827809232805-1824119854790-GawlVtq089UEuO1Yc0RW7BP3"

mes_text = "🟢miniface가 실행되었습니다."

post_message(myToken,"server-pc",mes_text)

#슬랙알림 종료

#MySQL연결정보
db_host = "127.0.0.1"
db_user = "root"
#db_password = "minjong5858@"
db_password = "134679qwer@"
db_name = "facedb"
#MySQL연결함수
def connect_db():
    return pymysql.connect(host=db_host, user=db_user, password=db_password, db=db_name, charset='utf8')
###사용자 데이터 조회 페이지
#detail페이지
@app.route('/facedetail', methods=['GET', 'POST'])
def facedetail():
    if request.method == 'POST':
        facecode = request.form['facecode']
        return redirect(url_for('show_user_data', facecode=facecode))
    return render_template('index.html')

# 이미지 파일 접근 제한
# 허용 referer URL
ALLOWED_REFERER = 'http://miniface.co.kr'

UPLOADS_DIRECTORY = current_dir+'/static/uploads'
@app.route('/uploads/<filename>')
def serve_image(filename):
    if request.referrer and ALLOWED_REFERER in request.referrer:
        return send_file(f"{UPLOADS_DIRECTORY}/{filename}")
    else:
        return "Access Denied"



@app.route('/facedetail/<facecode>', methods=['GET'])
def show_user_data(facecode):
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            sql = "SELECT * FROM userset2 WHERE facecode = %s"            
            cursor.execute(sql, facecode)
            user_data = cursor.fetchone()
            if user_data:
                # userID 테이블에서 해당 ID의 데이터가 존재하면 데이터를 표시합니다.
                return render_template('facedetail.html', user_data=user_data)
            else:
                # 해당 ID의 데이터가 존재하지 않으면 오류 페이지를 표시합니다.
                return render_template('error.html', message='해당 ID의 데이터가 존재하지 않습니다.')
    except Exception as e:
        return render_template('error.html', message=str(e))
    finally:
        conn.close()
# 
# 데이터베이스에 데이터 삽입 함수
def insert_data_to_db(facereview):
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            # sql = "INSERT INTO userset (timekey,facecode, f_all, f_eye1, f_eye2, f_nose1, f_nose2, f_lipup1, f_lipup2, f_score) VALUES (%s,%s, %s, %s, %s, %s, %s, %s, %s, %s)" #userset2로 변경
            sql = "INSERT INTO userset2 (timekey,facecode, f_all, f_eyeup1, f_eyeup2, f_eye1, f_eye2, f_nose1, f_nose2, f_nosewidth1, f_nosewidth2, f_lipup1, f_lipup2, f_uplip1, f_uplip2, f_downlip1, f_downlip2, f_chin1, f_chin2, f_score, sex, sns_name, graph_name,whytext,r1,r2,r3,r4,r5) VALUES (%s,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s ,%s,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            # for user_data in facereview:
            #     print("user_data",user_data)
            cursor.execute(sql, facereview)
        conn.commit()
    except Exception as e:
        print("데이터 삽입 오류:", str(e))
    finally:
        conn.close()

# 데이터베이스 업데이트 함수
def update_data_db(age, mbti, facecode):
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            sql = "UPDATE userset2 SET age=%s, mbti=%s where facecode = %s"
            cursor.execute(sql, (age, mbti,facecode))
        conn.commit()
    except Exception as e:
        print("데이터 업데이트 오류:", str(e))
    finally:
        conn.close()

# 폼에서 데이터를 받아와 데이터베이스 업데이트 함수 호출하는 라우트
@app.route('/update_data', methods=['POST'])
def update_data():
    age = request.form['age']
    mbti = request.form['mbti']
    facecode = request.form['facecode']
    
    # update_data_db 함수 호출
    update_data_db(age, mbti, facecode)

    return "상세 풀이를 시작합니다. 4초만 기다리세요."



@app.route('/')
def intro():
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            sql = "SELECT COUNT(*) FROM userset2"
            cursor.execute(sql)
            data_count = cursor.fetchone()[0]+7500
            print("data_count : ",data_count)
            return render_template('intro.html', data_count=data_count)
    except Exception as e:
        return str(e)

@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/sitemap')
def sitemap():
    return render_template('sitemap.xml')

@app.route('/robots.txt')
def robots():
    return render_template('robots.txt')


@app.route('/facestart')
def facestart():
    return render_template('facestart.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')
@app.route('/service')
def service():
    return render_template('service.html')

@app.route('/noface')
def noface():
    flash('이미지 타입의 파일만 사용 가능합니다.(png,jpg,jpeg)')
    return render_template('noface.html')

@app.route('/.well-known/pki-validation/<path:filename>')
def serve_pki_validation_file(filename):
    return send_from_directory('.well-known/pki-validation', filename)

#오류 처리 함수 정의
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404
@app.errorhandler(405)
def page_not_allowed(e):
    return render_template('405.html'), 405
@app.errorhandler(505)
def page_not_allowed(e):
    return render_template('505.html'), 505


ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



@app.route("/yourface2", methods=['GET','POST'])
def detect_faces_uri():
    if request.method == 'GET':
        # GET 요청일 경우 메인 페이지로 리다이렉트
        return redirect(url_for('main_page'))
    
    if request.method == 'POST':
        selected_radio = request.form.get('userSex')  # 라디오 버튼의 name 속성 값으로 가져옵니다.        
            # 선택된 라디오 버튼의 값 사용
        
        if selected_radio == 'female':
                # 옵션 1에 대한 처리
            # print("여자 입니다.")
            pass
        elif selected_radio == 'male':
                # 옵션 2에 대한 처리
            # print("남자 입니다.")
            pass
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        flash('No image selected for uploading')
        return redirect(request.url)
    
    if file and allowed_file(file.filename):
        datetimenow = datetime.today().strftime("%Y%m%d%H%M%S_")
        timekey=datetimenow
        # print("timekey === ",timekey)
        filename = datetimenow+secure_filename("a"+file.filename)
        filename_dot = datetimenow+secure_filename("a_dot"+file.filename)
        filename2 = datetimenow+secure_filename("a"+"_"+selected_radio+"_"+file.filename)
        lefteyename = datetimenow+"lefteye"+secure_filename("a"+file.filename)
        righteyename = datetimenow+"righteye"+secure_filename("a"+file.filename)
        nosename = datetimenow+"nose"+secure_filename("a"+file.filename)
        mouthname = datetimenow+"mouth"+secure_filename("a"+file.filename)
        
        file = Image.open(file)
        #이미지 회전 맞춰주기
        try:
                exif = file._getexif()
                orientation = exif.get(0x0112)
                if orientation == 3:
                    file = file.rotate(180, expand=True)
                    print("이미지 180 회전")
                elif orientation == 6:
                    file = file.rotate(270, expand=True)
                    print("이미지 270 회전")
                elif orientation == 8:
                    file = file.rotate(90, expand=True)
                    print("이미지 90 회전")
        except (AttributeError, KeyError, IndexError):
                # No EXIF or no orientation tag
                print("이미지 노 회전")
                pass
        
        #이미지 회전 종료
        width, height = file.size
        ratio = width/height
        # new_height = 1000
        # new_width = int(ratio*new_height)

        # print(filename)
        if width < 800:
            new_height = height
            new_width = width
        else:
            new_width = 800
            new_height = int(new_width/ratio)
            file = file.resize((new_width,new_height))

        #이미지 비트 변환
        if file.mode == 'RGBA':
            file = file.convert('RGB')
            print(f'이미지가 32비트에서 24비트로 변환되었습니다.')
        else:
            print('이미지는 이미 24비트입니다.')


        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        file.save(os.path.join(app.config['UPLOAD_FOLDER2'], filename2))
        # print('upload_image filename: ' +filename)
        flash('Image successfully uploaded and displayed below')
        faceresult = []
        facepoint = []

        print("file인식!!!!!!!!!!!!!")
        """Detects faces in the file located in Google Cloud Storage or the web."""
        # from google.cloud import vision
        client = vision.ImageAnnotatorClient()
        #file_name = os.path.abspath(filename)
        file_name = current_dir+"/static/uploads/"+filename
        file_name_dot = current_dir+"/static/uploads/"+filename_dot
        sns_name = current_dir+"/static/uploads/a"+filename
        graph_name = current_dir+"/static/graph/b"+filename
        # print("file_name : "+file_name)
        lefteye_name = current_dir+"/static/uploads/"+lefteyename
        righteye_name =current_dir+"/static/uploads/"+righteyename
        nose_name = current_dir+"/static/uploads/"+nosename
        mouth_name = current_dir+"/static/uploads/"+mouthname
        #경로 재설정20240410
        file_name2 = "/static/uploads/"+filename
        lefteye_name2 = "/static/uploads/"+lefteyename
        righteye_name2 = "/static/uploads/"+righteyename
        nose_name2 = "/static/uploads/"+nosename
        mouth_name2 = "/static/uploads/"+mouthname
        sns_name2 = "/static/uploads/a"+filename
        graph_name2 = "/static/graph/b"+filename
        file_name_dot2 = "/static/uploads/"+filename_dot

        logging.info('2024 327'+file_name+" , "+file_name_dot+ " , "+ sns_name + " , "+ nose_name)

        # absolute_path = os.path.join(current_dir, file_name)
        absolute_path = file_name
        logging.info('absolute_path')
        if os.path.exists(absolute_path):
            logging.info(f"The file  exists in the directory@@@.")
        else:
            logging.info(f"The file does not exist in the directory@@@.")

        with io.open(absolute_path, 'rb') as image_file:
            content = image_file.read()

        image = vision.Image(content=content)

        response = client.face_detection(image=image)
        faces = response.face_annotations
        

        likelihood_name = (int(0), int(0), int(30), int(60), int(80), int(100))
        
        try:
            faceresult.append(file_name2)
            faceresult.append(lefteye_name2)
            faceresult.append(righteye_name2)
            faceresult.append(nose_name2)
            faceresult.append(mouth_name2)

            for face in faces:
                faceresult.append(float(round((face.detection_confidence)*100, 1)))
                faceresult.append(float(round(face.pan_angle, 2)))
                # logging.info("faceangle358",float(round(face.pan_angle, 2)))
                if face.pan_angle > 0:
                    direction = "오른쪽👉🏻"
                elif face.pan_angle <0:
                    direction = "왼쪽👈🏻"
                else:
                    direction = "정면👨🏻‍🦲"
                faceresult.append(direction)
                faceresult.append(likelihood_name[face.anger_likelihood])
                faceresult.append(likelihood_name[face.joy_likelihood])
                faceresult.append(likelihood_name[face.sorrow_likelihood])
                faceresult.append(likelihood_name[face.surprise_likelihood])
                faceresult.append(likelihood_name[face.headwear_likelihood])
                faceresult.append(likelihood_name[face.under_exposed_likelihood])
                faceresult.append(likelihood_name[face.blurred_likelihood])
                vertices1 = (['({},{})'.format(vertex.x, vertex.y)
                            for vertex in face.bounding_poly.vertices])
                vertices2 = face.bounding_poly.vertices
                faceresult.append(vertices1)
                faceresult.append(sns_name2)
                faceresult.append(graph_name2)
                faceresult.append(file_name_dot2)
                
                # 그외 점 그리기
                fd_line = face.fd_bounding_poly.vertices
                count = 1
            
            for landmark in face.landmarks:
            
                facepoint.append(landmark.position)
                greenpoint = 1
                ld_lefteye = greenpoint
            
            #눈의 기울기 구하기
            x19 =  facepoint[19].x
            y19 =  facepoint[19].y
            x21 =  facepoint[21].x
            y21 =  facepoint[21].y
            
            
            # 두 점의 기울기 계산
            slope = (y21 - y19) / (x21 - x19)
            #아크탄젠트 함수를 사용하여 각도 계산(라디안)
            angle_radians = math.atan(slope)
            
            #라디안을 각도로 변환
            angle_degrees = math.degrees(angle_radians)
            # print("👱🏻‍♀️얼굴의 각도 : ",str(angle_degrees))
            # 이미지 파일 읽기
            
            logging.info(filename)
            logging.info(file_name)
            image = Image.open(file_name)
            
            # 얼굴 사이즈에 맞는 원형 영역 계산
            # 얼굴 크기에 해당하는 원의 반지름 계산
            radius = int(max(np.linalg.norm(np.array([facepoint[27].x, facepoint[27].y]) - np.array([facepoint[26].x, facepoint[26].y])),
                            np.linalg.norm(np.array([facepoint[27].x, facepoint[27].y]) - np.array([facepoint[29].x, facepoint[29].y])),
                            np.linalg.norm(np.array([facepoint[26].x, facepoint[26].y]) - np.array([facepoint[29].x, facepoint[29].y]))))
            
            # 이미지의 폭과 높이 중 작은 값을 원의 지름으로 설정
            diameter = min(image.size)
            if radius * 2 > diameter:
                radius = diameter // 2
            
            # 이미지 중심 좌표 추가 0415
            center = (int(facepoint[6].x), int(facepoint[6].y))

            # 원형으로 자르기 위한 마스크 생성
            mask = Image.new('L', image.size, 0)
            draw = ImageDraw.Draw(mask)
            
            #얼굴이 화면 밖으로 잘리면 더 크게 원을 그릴것
            if facepoint[6].x - radius >= 0 and facepoint[6].x + radius < new_width :
                #얼굴이 잘리지 않는 경우
                draw.ellipse([center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius], fill=255)
            else:
                # 얼굴리 잘리는 경우
                draw.ellipse([center[0] - radius*1.5, center[1] - radius*1.5, center[0] + radius*1.5, center[1] + radius*1.5], fill=255)

            # 이미지를 원형으로 자르기
            cropped_image = Image.new('RGBA', image.size, (0, 0, 0, 0))  # 투명 배경을 가진 이미지 생성
            cropped_image.paste(image, mask=mask)

            # 원형으로 자른 이미지의 바운딩 박스 계산
            bbox = cropped_image.getbbox()

            # 바운딩 박스에 맞게 이미지 크기 조정
            cropped_image = cropped_image.crop(bbox)

            # 이미지 회전
            # 이미지를 OpenCV 형식으로 변환
            rotated_image = np.array(cropped_image)
            # 이미지 중심 좌표
            center = (rotated_image.shape[1] // 2, rotated_image.shape[0] // 2)
            # 회전 변환 행렬 계산
            if angle_degrees >= 0 and facepoint[21].y > facepoint[19].y :
                rotation_matrix = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
            elif angle_degrees >= 0 and facepoint[21].y < facepoint[19].y :
                rotation_matrix = cv2.getRotationMatrix2D(center, angle_degrees+180, 1.0)
            elif facepoint[21].y == facepoint[19].y :
                if facepoint[21].x < facepoint[19].x:
                    rotation_matrix = cv2.getRotationMatrix2D(center, 180, 1.0)
                else:
                    pass
            elif angle_degrees < 0 and facepoint[21].y > facepoint[19].y :
                rotation_matrix = cv2.getRotationMatrix2D(center, angle_degrees+180, 1.0)
            elif angle_degrees < 0 and facepoint[21].y < facepoint[19].y :
                rotation_matrix = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
            
            # 이미지 회전
            rotated_image = cv2.warpAffine(rotated_image, rotation_matrix, (rotated_image.shape[1], rotated_image.shape[0]))

            # 회전된 이미지를 PIL 형식으로 변환
            rotated_image_pil = Image.fromarray(rotated_image)
            # 회전된 이미지를 PNG 파일로 저장 (투명 배경 포함)
            rotated_image_pil.save(file_name, format="PNG")
            #저장된 이미지를 이미지 중심 좌표에서 radius 길이의 반지름 가지는 원형으로 자르고 file_name으로 다시 저장
            # print("@@@@@저장완료!")

            with io.open(absolute_path, 'rb') as image_file:
                content = image_file.read()

            image = vision.Image(content=content)

            response = client.face_detection(image=image)
            faces = response.face_annotations

            for face in faces:
                count = 1

            facepoint = []
            for landmark in face.landmarks:

                facepoint.append(landmark.position)

            facereview = drawVertices(content, vertices2, filename, fd_line, facepoint,lefteyename,righteyename,nosename,mouthname,vertices1,timekey,selected_radio, filename_dot, radius)
            # facereview = drawVertices()
            
            if response.error.message:
                raise Exception(
                    '{}\nFor more info on error messages, check: '
                    'https://cloud.google.com/apis/design/errors'.format(
                        response.error.message))
            # time.sleep(1)
            # 20240416 주석추가
            # print("facereview : ",facereview)
            insert_data_to_db(facereview)   
            
            #캐시 동작 해제해서 넘기기 
            return render_template('faceview.html', variable=faceresult, variable2=facereview)
            # response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            # return response
            #아래꺼 기존소스
            # return render_template("faceview.html", variable=faceresult, variable2=facereview)
        except Exception as e:
            print("예외발생!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@",datetimenow,e)
            flash('이미지 타입의 파일만 사용 가능합니다.(png,jpg,jpeg)')
            return redirect("/noface")
    else:
        flash('이미지 타입의 파일만 사용 가능합니다.(png,jpg,jpeg)')
        return redirect(request.url)
# detect_faces_uri(uri)
       
    # else:
    #     flash('이미지 타입의 파일만 사용 가능합니다.(png,jpg,jpeg)')
    #     return redirect(request.url)
        
# 메인 페이지에 대한 라우트 추가
@app.route("/", methods=['GET'])
def main_page():
    # 메인 페이지로 리다이렉트 또는 메인 페이지 렌더링
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            sql = "SELECT COUNT(*) FROM userset2"
            cursor.execute(sql)
            data_count = cursor.fetchone()[0]
            print("data_count : ",data_count)
            return render_template('intro.html', data_count=data_count)
    except Exception as e:
        return str(e)

    # return render_template("intro.html")  # main_page.html은 실제 메인 페이지에 해당하는 템플릿 파일로 변경해야 합니다.



if __name__ == "__main__":
    app.run(port=2222)

# if __name__ == "__main__":
#     from waitress import serve
#     serve(app, host='0.0.0.0', port=443)

# if __name__ == "__main__":
#     ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
#     ssl_context.load_cert_chain(certfile='certificate.crt', keyfile='private.key', password='123')

#     app.run(host="0.0.0.0", port=2500, ssl_context=ssl_context, debug=False)



# if __name__ == "__main__":
#     app.run(host='0.0.0.0', debug=False, port=443)
    
