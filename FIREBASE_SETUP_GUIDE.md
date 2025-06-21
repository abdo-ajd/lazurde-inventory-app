# دليل إعداد Firebase بالصور (نسخة مبسطة)

اتبع هذه الخطوات لربط تطبيقك بالسحابة.

---

**ملاحظة هامة:** جميع الخطوات في هذا الدليل تستخدم خطة Firebase المجانية (Spark Plan) التي **لا تتطلب بطاقة ائتمان**. إذا طلب منك الموقع إدخال معلومات بطاقة ائتمان، فهذا يعني أنك على وشك ترقية المشروع إلى الخطة المدفوعة. **تجاهل هذا الطلب** وتأكد من أنك تتبع الخطوات كما هي موضحة.

---

### المرحلة الأولى: إنشاء مشروع Firebase

1.  اذهب إلى [وحدة تحكم Firebase](https://console.firebase.google.com/) واضغط على **"Add project"**.

    ![الضغط على زر إضافة مشروع في شاشة Firebase الرئيسية.](https://placehold.co/800x400.png "Firebase Console Add Project")
    *(صورة توضيحية: شاشة Firebase الرئيسية مع سهم يشير إلى زر "Add project")*

2.  اكتب اسمًا لمشروعك (مثلاً: `lazurde-inventory-app`)، **ثم قم بإلغاء تفعيل خيار Google Analytics** واضغط **"Create project"**.

    ![إدخال اسم المشروع وإلغاء تفعيل Google Analytics.](https://placehold.co/800x500.png "Firebase Project Name and Analytics Toggle")
    *(صورة توضيحية: نافذة إنشاء المشروع مع حقل الاسم وزر تفعيل/إلغاء تفعيل Analytics)*

---

### المرحلة الثانية: الحصول على مفاتيح الربط

1.  من داخل مشروعك، اضغط على أيقونة الويب `</>`.

    ![الضغط على أيقونة الويب لبدء تسجيل تطبيق.](https://placehold.co/800x400.png "Firebase Add Web App Icon")
    *(صورة توضيحية: لوحة تحكم المشروع مع سهم يشير إلى أيقونة الويب)*

2.  اكتب اسمًا مستعارًا للتطبيق (مثلاً: `web-app`) ثم اضغط **"Register app"**. **لا تحدد خيار Firebase Hosting**.

    ![تسجيل تطبيق الويب مع إدخال الاسم المستعار.](https://placehold.co/800x400.png "Firebase Register Web App")
    *(صورة توضيحية: نافذة تسجيل التطبيق مع حقل الاسم)*

3.  الآن ستظهر لك مفاتيح الربط. **انسخ الكائن `firebaseConfig` بالكامل**.

    ![نسخ كائن firebaseConfig من الشيفرة المعروضة.](https://placehold.co/800x500.png "Firebase Copy Config Object")
    *(صورة توضيحية: الشيفرة البرمجية مع تحديد واضح لكائن `firebaseConfig`)*

---

### المرحلة الثالثة: لصق المفاتيح في الكود

1.  اذهب إلى ملف `src/lib/firebase.ts` في محرر الكود.
2.  **احذف الكائن `firebaseConfig` الوهمي** والصق الكائن الذي نسخته للتو.

---

### المرحلة الرابعة: تفعيل الخدمات

1.  من القائمة الجانبية، اذهب إلى **Build > Firestore Database** واضغط **"Create database"**.

    ![الذهاب إلى Firestore والضغط على إنشاء قاعدة بيانات.](https://placehold.co/800x400.png "Firebase Create Firestore Database")
    *(صورة توضيحية: القائمة الجانبية لـ Firebase مع تحديد Firestore)*

2.  اختر **"Start in production mode"** ثم **Next**. اختر موقعًا قريبًا (مثلاً `europe-west`) ثم **"Enable"**.

    ![اختيار وضع الإنتاج والموقع لـ Firestore.](https://placehold.co/800x450.png "Firebase Firestore Production Mode")
    *(صورة توضيحية: نافذة إعداد قاعدة البيانات مع تحديد وضع الإنتاج)*

3.  من القائمة الجانبية، اذهب إلى **Build > Storage** واضغط **"Get started"** ثم اتبع الخطوات.

---

### المرحلة الخامسة: تحديث قواعد الأمان (لاختبار الاتصال)

1.  اذهب إلى **Firestore Database** ثم تبويب **Rules**. استبدل المحتوى بالقاعدة التالية واضغط **Publish**:

    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          // للسماح بأي عملية كتابة وقراءة للتحقق من الاتصال
          // ملاحظة: هذه القاعدة غير آمنة للإنتاج. سنقوم بتأمينها لاحقاً.
          allow read, write: if true;
        }
      }
    }
    ```
    ![لصق قواعد الأمان الجديدة في Firestore Rules.](https://placehold.co/800x400.png "Firebase Firestore Security Rules")
    *(صورة توضيحية: محرر قواعد Firestore مع القاعدة الجديدة)*

2.  اذهب إلى **Storage** ثم تبويب **Rules**. استبدل المحتوى بالقاعدة التالية واضغط **Publish**:

    ```javascript
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          // للسماح بأي عملية كتابة وقراءة للتحقق من الاتصال
          // ملاحظة: هذه القاعدة غير آمنة للإنتاج. سنقوم بتأمينها لاحقاً.
          allow read, write: if true;
        }
      }
    }
    ```
    ![لصق قواعد الأمان الجديدة في Storage Rules.](https://placehold.co/800x400.png "Firebase Storage Security Rules")
    *(صورة توضيحية: محرر قواعد Storage مع القاعدة الجديدة)*

---

بهذا تكون قد انتهيت! تطبيقك الآن متصل بالسحابة.
