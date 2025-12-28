document.addEventListener('DOMContentLoaded', () => {

  // Ensure each realtime session has a unique id for tool responses

  const timestamp = Date.now();

  const sessionId = `session_${timestamp}`;

  localStorage.setItem('session_id', sessionId);

  const sessionIdInput = document.getElementById('sessionId');

  if (sessionIdInput) sessionIdInput.value = sessionId;



  const officerLangSelect = document.getElementById('officer-lang-select');

  const inmateLangSelect = document.getElementById('inmate-lang-select');

  const telemetryLangs = document.getElementById('telemetry-langs');

  const screenLoading = document.getElementById('screen-loading');

  const screenLive = document.getElementById('screen-live');

  const startButton = document.getElementById('start-session-btn');

  const backButton = document.getElementById('back-to-status');

  const readyWrapper = document.getElementById('ready-button-wrapper');

  const headingDots = document.getElementById('heading-dots');

  const statusHeading = document.getElementById('status-heading');

  const statusSubheading = document.getElementById('status-subheading');

  const statusOrb = document.getElementById('status-orb');

  const statusContainer = document.getElementById('status-container');

  const uiLangToggle = document.getElementById('ui-lang-toggle');

  const micButton = document.getElementById('talkButton');

  const micStatus = document.getElementById('mic-status');

  const micStatusDots = document.getElementById('mic-status-dots');

  const conversationSection = document.getElementById('conversation-section');



  // Full language list and persistence logic from the original popup menu

  const languages = [

    'Auto-detect',

    'Dutch',

    'Spanish',

    'Korean',

    'Italian',

    'German',

    'Thai',

    'Russian',

    'Portuguese',

    'Polish',

    'Indonesian',

    'Mandarin (TW)',

    'Swedish',

    'Czech',

    'English',

    'Japanese',

    'French',

    'Romanian',

    'Cantonese (CN)',

    'Turkish',

    'Mandarin (CN)',

    'Catalan',

    'Hungarian',

    'Ukrainian',

    'Greek',

    'Bulgarian',

    'Arabic',

    'Serbian',

    'Macedonian',

    'Cantonese (HK)',

    'Latvian',

    'Slovenian',

    'Hindi',

    'Galician',

    'Danish',

    'Urdu',

    'Slovak',

    'Hebrew',

    'Finnish',

    'Azerbaijani',

    'Lithuanian',

    'Estonian',

    'Nynorsk',

    'Welsh',

    'Punjabi',

    'Afrikaans',

    'Persian',

    'Basque',

    'Vietnamese',

    'Bengali',

    'Nepali',

    'Marathi',

    'Belarusian',

    'Kazakh',

    'Armenian',

    'Swahili',

    'Tamil',

    'Albanian',

    'FLEURS',

    'Spanish',

    'Italian',

    'Korean',

    'Portuguese',

    'English',

    'Polish',

    'Catalan',

    'Japanese',

    'German',

    'Russian',

    'Dutch',

    'French',

    'Indonesian',

    'Ukrainian',

    'Turkish',

    'Malay',

    'Swedish',

    'Mandarin',

    'Finnish',

    'Norwegian',

    'Romanian',

    'Thai',

    'Vietnamese',

    'Slovak',

    'Arabic',

    'Czech',

    'Croatian',

    'Greek',

    'Serbian',

    'Danish',

    'Bulgarian',

    'Hungarian',

    'Filipino',

    'Bosnian',

    'Galician',

    'Macedonian',

    'Hindi',

    'Estonian',

    'Slovenian',

    'Tamil',

    'Latvian',

    'Azerbaijani',

    'Urdu',

    'Lithuanian',

    'Hebrew',

    'Welsh',

    'Persian',

    'Icelandic',

    'Kazakh',

    'Afrikaans',

    'Kannada',

    'Marathi',

    'Swahili',

    'Telugu',

    'Maori',

    'Nepali',

    'Armenian',

    'Belarusian',

    'Gujarati',

    'Punjabi',

    'Bengali',

  ];



  // Default languages if none set yet
  // Default input language is English instead of Auto-detect
  if (!localStorage.getItem('input_language')) {

    localStorage.setItem('input_language', 'English');

  }

  if (!localStorage.getItem('output_language')) {

    localStorage.setItem('output_language', 'Arabic');

  }



  // Populate the two dropdowns with the original language list

  if (officerLangSelect && inmateLangSelect) {

    officerLangSelect.innerHTML = '';

    inmateLangSelect.innerHTML = '';



    languages.forEach((language) => {

      const opt1 = document.createElement('option');

      opt1.value = language;

      opt1.textContent = language;

      officerLangSelect.appendChild(opt1);



      const opt2 = document.createElement('option');

      opt2.value = language;

      opt2.textContent = language;

      inmateLangSelect.appendChild(opt2);

    });

  }



  // Restore selected languages from localStorage

  const storedInput = localStorage.getItem('input_language') || 'English';

  const storedOutput = localStorage.getItem('output_language') || 'Arabic';



  if (officerLangSelect) {

    officerLangSelect.value = storedInput;

    officerLangSelect.addEventListener('change', () => {

      localStorage.setItem('input_language', officerLangSelect.value);

      window.location.reload();

    });

  }



  if (inmateLangSelect) {

    inmateLangSelect.value = storedOutput;

    inmateLangSelect.addEventListener('change', () => {

      localStorage.setItem('output_language', inmateLangSelect.value);

      window.location.reload();

    });

  }



  if (telemetryLangs) {

    const inputCode =

      storedInput === 'Auto-detect'

        ? 'AUTO'

        : storedInput.slice(0, 2).toUpperCase();

    const outputCode = storedOutput.slice(0, 2).toUpperCase();

    telemetryLangs.textContent = `${inputCode} ⇄ ${outputCode}`;

  }



  // ----- Screen 1 status animation (loading → ready) -----

  let dotStep = 0;

  let completedSteps = 0;

  const totalSteps = 5;



  function updateChecklist() {

    for (let i = 1; i <= totalSteps; i++) {

      const icon = document.getElementById(`check-step-${i}`);

      if (!icon) continue;

      if (completedSteps >= i) {

        icon.textContent = '✔';

        icon.classList.remove('check-icon--pending');

        icon.classList.add('check-icon--success');

      }

    }

  }



  // Dots on heading while loading

  const headingInterval = window.setInterval(() => {

    dotStep = (dotStep + 1) % 3;

    if (headingDots) {

      headingDots.textContent = '.'.repeat(dotStep + 1);

    }

  }, 500);



  // Sequential checklist completion

  const checklistInterval = window.setInterval(() => {

    if (completedSteps >= totalSteps) {

      window.clearInterval(checklistInterval);

      return;

    }

    completedSteps += 1;

    updateChecklist();

  }, 400);



  // After a short delay, mark translator as ready

  window.setTimeout(() => {

    if (statusOrb) {

      statusOrb.classList.remove('orb--loading');

      statusOrb.classList.add('orb--ready');

    }

    if (startButton) {

      startButton.disabled = false;

    }

    if (readyWrapper) {

      readyWrapper.classList.add('ready-button-wrapper--visible');

    }

    window.clearInterval(headingInterval);

    if (headingDots) headingDots.textContent = '';



    // Switch checklist styling from "preparing" (gray) to "ready" (accent)

    if (statusContainer) {

      statusContainer.classList.remove('status-preparing');

      statusContainer.classList.add('status-ready');

    }



    // Update heading and helper text to "Inova Translator Ready" using UI language

    const uiLang = localStorage.getItem('ui_lang') || 'en';

    if (statusHeading) {

      if (uiLang === 'ar') {

        statusHeading.innerHTML =

          'منصة إنوفا للترجمة <span class="heading-ready">جاهزة</span>';

      } else {

        statusHeading.innerHTML =

          'Inova Translator <span class="heading-ready">Ready</span>';

      }

    }

    if (statusSubheading) {

      statusSubheading.textContent =

        uiLang === 'ar'

          ? 'يمكنك البدء في التحدث عند الضغط على الزر.'

          : 'You can start speaking when you press the button.';

    }

  }, 2600);



  // ----- Navigation: Screen 1 → Screen 2 -----

  if (startButton && screenLoading && screenLive) {

    startButton.addEventListener('click', () => {

      screenLoading.classList.remove('screen--active');

      screenLoading.classList.add('screen--hidden');

      screenLive.classList.remove('screen--hidden');

      screenLive.classList.add('screen--active');

      // Ensure viewport starts at the very top (hamburger visible) on mobile/tablet
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

    });

  }



  // ----- Navigation: Live screen → Status screen -----

  if (backButton && screenLoading && screenLive) {

    backButton.addEventListener('click', () => {

      // Stop any active realtime session

      if (window.pc && window.pc.connectionState === 'connected') {

        if (typeof stopSession === 'function') {

          stopSession();

        }

        if (conversationSection) conversationSection.classList.add('hidden');

        if (micStatus) micStatus.classList.add('hidden');

      }



      // Switch screens

      screenLive.classList.remove('screen--active');

      screenLive.classList.add('screen--hidden');

      screenLoading.classList.remove('screen--hidden');

      screenLoading.classList.add('screen--active');

    });

  }



  // ----- Mic button wiring (start / stop realtime session) -----

  let micDotsStep = 0;

  let micDotsInterval = null;



  function startMicDots() {

    if (!micStatusDots) return;

    if (micDotsInterval) window.clearInterval(micDotsInterval);

    micDotsInterval = window.setInterval(() => {

      micDotsStep = (micDotsStep + 1) % 3;

      micStatusDots.textContent = '.'.repeat(micDotsStep + 1);

    }, 500);

  }



  function stopMicDots() {

    if (micDotsInterval) {

      window.clearInterval(micDotsInterval);

      micDotsInterval = null;

    }

    if (micStatusDots) micStatusDots.textContent = '';

  }



  if (micButton) {

    micButton.addEventListener('click', async () => {

      if (window.pc && window.pc.connectionState === 'connected') {

        // Stop existing session

        if (typeof stopSession === 'function') {

          stopSession();

        }

        if (conversationSection) conversationSection.classList.add('hidden');

        if (micStatus) micStatus.classList.add('hidden');

        stopMicDots();

      } else {

        // Start new realtime session

        if (typeof init === 'function') {

          await init();

        }

        if (conversationSection) conversationSection.classList.remove('hidden');

        if (micStatus) micStatus.classList.remove('hidden');

        startMicDots();

        // After mic permissions are granted and the session starts,
        // scroll the viewport all the way down so the user sees
        // the live transcript and notes area.
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });

      }

    });

  }



  // ----- UI language toggle (EN ↔ AR) for chrome only (does not affect system prompt) -----

  if (uiLangToggle) {

    const applyUiLang = (lang) => {

      localStorage.setItem('ui_lang', lang);



      // Update document direction

      if (lang === 'ar') {

        document.documentElement.lang = 'ar';

        document.documentElement.dir = 'rtl';

        // When everything is Arabic, show the word "English" so users know they can switch back

        uiLangToggle.textContent = 'English';

      } else {

        document.documentElement.lang = 'en';

        document.documentElement.dir = 'ltr';

        // When UI is English, show the target language in Arabic (word "Arabic" in Arabic)

        uiLangToggle.textContent = 'عربي';

      }

      // Swap top GIF logo based on UI language
      const appLogo = document.querySelector('.app-logo');
      if (appLogo) {
        appLogo.src =
          lang === 'ar' ? 'inova-translator-arabic.gif' : 'inova-translator.gif';
      }



      // Translate key UI strings (excluding language dropdowns and mic text)

      const t = (en, ar) => (lang === 'ar' ? ar : en);



      // Update page title (EN ⇄ AR)
      document.title = t('Inova Translator', 'مترجم إنوفا');



      // Update status heading based on current state (preparing vs ready)
      const statusHeadingEl = document.getElementById('status-heading');
      if (statusHeadingEl) {
        const readySpan = statusHeadingEl.querySelector('.heading-ready');
        if (readySpan) {
          // Ready state
          statusHeadingEl.innerHTML =
            lang === 'ar'
              ? 'منصة إنوفا للترجمة <span class="heading-ready">جاهزة</span>'
              : 'Inova Translator <span class="heading-ready">Ready</span>';
        } else {
          // Preparing state – keep dots span intact while translating text parts
          const prepSpan = statusHeadingEl.querySelector('.heading-preparing');
          if (prepSpan) {
            prepSpan.textContent = t('Preparing', 'جارٍ التحضير');
          }
          // Update the plain text node between preparing span and dots span
          const dotsEl = document.getElementById('heading-dots');
          if (dotsEl) {
            const parent = dotsEl.parentNode;
            if (parent) {
              const siblings = Array.from(parent.childNodes);
              const textNode = siblings.find(
                (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== ''
              );
              if (textNode) {
                textNode.textContent =
                  lang === 'ar' ? ' المترجم الآمن ' : ' Secure Translator ';
              }
            }
          }
        }
      }

      const statusSubheadingEl = document.getElementById('status-subheading');

      if (statusSubheadingEl) {

        statusSubheadingEl.textContent = t(

          "We're setting up your audio and language channels.",

          'نقوم بإعداد قنوات الصوت واللغة الخاصة بك.'

        );

      }



      const checklistTitles = document.querySelectorAll('.check-text-title');

      const checklistHelps = document.querySelectorAll('.check-text-help');

      if (checklistTitles.length >= 5 && checklistHelps.length >= 5) {

        checklistTitles[0].textContent = t('Secure connection', 'اتصال آمن');

        checklistHelps[0].textContent = t(

          'TLS encrypted channel between device and translator service.',

          'قناة TLS مشفّرة بين الجهاز وخدمة المترجم.'

        );

        checklistTitles[1].textContent = t('Checking microphone', 'فحص الميكروفون');

        checklistHelps[1].textContent = t(

          'Input levels and permissions for both languages.',

          'التحقق من مستويات الإدخال والصلاحيات لكلتا اللغتين.'

        );

        checklistTitles[2].textContent = t(

          'Initializing language engine',

          'تهيئة محرّك اللغة'

        );

        checklistHelps[2].textContent = t(

          'Arabic–English real-time translation pipeline.',

          'خط أنابيب ترجمة فورية بين العربية والإنجليزية.'

        );

        checklistTitles[3].textContent = t(

          'Session safeguards',

          'حماية الجلسة'

        );

        checklistHelps[3].textContent = t(

          'Role-based access, audit logging, and incident flags for this session.',

          'صلاحيات مبنية على الدور وسجلات تدقيق وإشعارات للحوادث.'

        );

        checklistTitles[4].textContent = t(

          'Session transcript',

          'تفريغ الجلسة'

        );

        checklistHelps[4].textContent = t(

          'Secure transcript capture enabled for officer review after the visit.',

          'تفعيل حفظ نص آمن لمراجعة الضابط بعد الزيارة.'

        );

      }



      const officerLabel = document.querySelector(

        'label[for="officer-lang-select"]'

      );

      const inmateLabel = document.querySelector(

        'label[for="inmate-lang-select"]'

      );

      if (officerLabel) {

        officerLabel.textContent = t(

          'OFFICER LANGUAGE (INPUT):',

          'لضابط (إدخال):'

        );

      }

      if (inmateLabel) {

        inmateLabel.textContent = t(

          'INMATE LANGUAGE (OUTPUT):',

          'لغة النزيل (إخراج):'

        );

      }



      const startBtn = document.getElementById('start-session-btn');

      if (startBtn) {

        startBtn.textContent = t(

          'Start Translation Session',

          'بدء جلسة الترجمة'

        );

      }


      // Header brand + login pill
      const brandText = document.querySelector('.app-brand-text');
      if (brandText) {
        brandText.textContent = t('Powered By', 'مشغّل بواسطة');
      }

      const loginPill = document.querySelector('.top-pill--login');
      if (loginPill) {
        loginPill.textContent = t('Login', 'تسجيل الدخول');
      }

      // Dummy assignment dropdowns (officer, inmate, purpose, device)
      const officerDummyLabel = document.querySelector(
        'label[for="officer-dummy-select"]'
      );
      const inmateDummyLabel = document.querySelector(
        'label[for="inmate-dummy-select"]'
      );
      const purposeDummyLabel = document.querySelector(
        'label[for="purpose-dummy-select"]'
      );
      const deviceDummyLabel = document.querySelector(
        'label[for="device-dummy-select"]'
      );

      if (officerDummyLabel) {
        officerDummyLabel.textContent = t('OFFICER:', 'الضابط:');
      }
      if (inmateDummyLabel) {
        inmateDummyLabel.textContent = t('INMATE:', 'النزيل:');
      }
      if (purposeDummyLabel) {
        purposeDummyLabel.textContent = t('PURPOSE:', 'الغرض:');
      }
      if (deviceDummyLabel) {
        deviceDummyLabel.textContent = t('DEVICE:', 'الجهاز:');
      }

      const officerDummySelect = document.getElementById('officer-dummy-select');
      if (officerDummySelect) {
        const officerNamesEn = {
          officer1: 'Lt. Faisal Al-Harbi',
          officer2: 'Sgt. Omar Al-Qahtani',
          officer3: 'Officer Lina Al-Saad',
          officer4: 'Officer David Mitchell',
          officer5: 'Captain Rania Al-Faraj',
        };
        const officerNamesAr = {
          officer1: 'الملازم فيصل الحربي',
          officer2: 'الرقيب عمر القحطاني',
          officer3: 'الشرطية لينا السعد',
          officer4: 'الشرطي ديفيد ميتشل',
          officer5: 'النقيب رانيا الفرج',
        };
        Array.from(officerDummySelect.options).forEach((opt) => {
          const key = opt.value;
          if (lang === 'ar') {
            opt.textContent = officerNamesAr[key] || opt.textContent;
          } else {
            opt.textContent = officerNamesEn[key] || opt.textContent;
          }
        });
      }

      const inmateDummySelect = document.getElementById('inmate-dummy-select');
      if (inmateDummySelect) {
        Array.from(inmateDummySelect.options).forEach((opt) => {
          const { id, needEn, needAr } = opt.dataset;
          if (!id || !needEn || !needAr) return;
          const prefix = lang === 'ar' ? 'النزيل' : 'Inmate';
          const need = lang === 'ar' ? needAr : needEn;
          opt.textContent = `${prefix} ${id} · ${need}`;
        });
      }

      const purposeDummySelect = document.getElementById('purpose-dummy-select');
      if (purposeDummySelect) {
        Array.from(purposeDummySelect.options).forEach((opt) => {
          const { en, ar } = opt.dataset;
          if (!en || !ar) return;
          opt.textContent = lang === 'ar' ? ar : en;
        });
      }

      const deviceDummySelect = document.getElementById('device-dummy-select');
      if (deviceDummySelect) {
        Array.from(deviceDummySelect.options).forEach((opt) => {
          const { en, ar } = opt.dataset;
          if (!en || !ar) return;
          opt.textContent = lang === 'ar' ? ar : en;
        });
      }

      // Telemetry pills (translate labels/text but keep numbers)
      const telemetryItems = document.querySelectorAll('.telemetry-item');
      if (telemetryItems.length >= 4) {
        const [statusItem, latencyItem, connectionItem, langsItem] = telemetryItems;

        const statusLabelEl = statusItem.querySelector('.telemetry-label');
        const statusValueEl = statusItem.querySelector('.telemetry-value');
        if (statusLabelEl) statusLabelEl.textContent = t('Status', 'الحالة');
        if (statusValueEl) {
          statusValueEl.textContent = t('Online – Encrypted', 'متصل – مشفّر');
        }

        const latencyLabelEl = latencyItem.querySelector('.telemetry-label');
        const latencyValueEl = latencyItem.querySelector('.telemetry-value');
        if (latencyLabelEl) latencyLabelEl.textContent = t('Latency', 'زمن الاستجابة');
        if (latencyValueEl) {
          const text = (latencyValueEl.textContent || '').trim();
          const match = text.match(/(\d+)\s*ms/i);
          const num = match ? match[1] : '';
          latencyValueEl.textContent =
            lang === 'ar'
              ? (num ? `${num} مللي ثانية` : 'مللي ثانية')
              : (num ? `${num} ms` : 'ms');
        }

        const connLabelEl = connectionItem.querySelector('.telemetry-label');
        const connValueEl = connectionItem.querySelector('.telemetry-value');
        if (connLabelEl) connLabelEl.textContent = t('Connection', 'الاتصال');
        if (connValueEl) {
          const text = (connValueEl.textContent || '').trim();
          const lossMatch = text.match(/([0-9.,]+%)/);
          const loss = lossMatch ? lossMatch[1] : '';
          connValueEl.textContent =
            lang === 'ar'
              ? (loss ? `مستقر · فقدان ${loss}` : 'اتصال مستقر')
              : (loss ? `Stable · ${loss} loss` : 'Stable connection');
        }

        const langsLabelEl = langsItem.querySelector('.telemetry-label');
        if (langsLabelEl) langsLabelEl.textContent = t('Languages', 'اللغات');
        // Value shows language codes; leave as-is
      }

      // Location strip (keep room ID and numeric time as-is)
      const locationStrip = document.querySelector('.location-strip');
      if (locationStrip) {
        const leftCell = locationStrip.querySelector('div:not(.location-strip-meta)');
        const metaCell = locationStrip.querySelector('.location-strip-meta');

        if (leftCell) {
          leftCell.textContent = t(
            '📍 Riyadh Central Facility · Medical Wing · Room M-203',
            '📍 مرفق الرياض المركزي · الجناح الطبي · Room M-203'
          );
        }

        if (metaCell) {
          const raw = (metaCell.textContent || '').trim();
          const timeMatch = raw.match(/Local time\s+([0-9:]+)/i);
          const time = timeMatch ? timeMatch[1] : '14:03';
          metaCell.textContent = t(
            `Device RT-UNIT-07 · Local time ${time}`,
            `الجهاز RT-UNIT-07 · التوقيت المحلي ${time}`
          );
        }
      }

      // Officer & inmate cards (translate labels/text; keep IDs, ages, languages)
      const officerCard = document.querySelector(
        '.identity-card[aria-label="Officer profile"]'
      );
      const inmateCard = document.querySelector(
        '.identity-card[aria-label="Inmate profile"]'
      );

      if (officerCard) {
        const chip = officerCard.querySelector('.identity-role-chip--officer');
        if (chip) {
          chip.textContent = t('Officer', 'الضابط');
        }

        const rows = officerCard.querySelectorAll('tbody tr');
        if (rows.length >= 6) {
          // Name
          const nameLabel = rows[0].querySelector('th[scope="row"]');
          const nameValue = rows[0].querySelector('td');
          if (nameLabel) nameLabel.textContent = t('Name', 'الاسم');
          if (nameValue) {
            nameValue.textContent = t('Lt. Faisal Al-Harbi', 'الملازم فيصل الحربي');
          }

          // Badge (keep number)
          const badgeLabel = rows[1].querySelector('th[scope="row"]');
          if (badgeLabel) badgeLabel.textContent = t('Badge', 'الرقم الوظيفي');

          // Designation
          const desigLabel = rows[2].querySelector('th[scope="row"]');
          const desigValue = rows[2].querySelector('td');
          if (desigLabel) desigLabel.textContent = t('Designation', 'المسمى الوظيفي');
          if (desigValue) {
            desigValue.textContent = t(
              'Corrections officer · Block C Security',
              'ضابط إصلاحيات · أمن العنبر C'
            );
          }

          // Primary role
          const roleLabel = rows[3].querySelector('th[scope="row"]');
          const roleValue = rows[3].querySelector('td');
          if (roleLabel) roleLabel.textContent = t('Primary role', 'الدور الرئيسي');
          if (roleValue) {
            roleValue.textContent = t('Primary communicator', 'المتحدّث الرئيسي');
          }

          // Age (keep numeric)
          const ageLabelOff = rows[4].querySelector('th[scope="row"]');
          if (ageLabelOff) ageLabelOff.textContent = t('Age', 'العمر');

          // Primary language (keep language text)
          const langLabelOff = rows[5].querySelector('th[scope="row"]');
          if (langLabelOff) {
            langLabelOff.textContent = t('Primary language', 'اللغة الرئيسية');
          }
        }
      }

      if (inmateCard) {
        const chip = inmateCard.querySelector('.identity-role-chip--inmate');
        if (chip) {
          chip.textContent = t('Inmate', 'النزيل');
        }

        const rows = inmateCard.querySelectorAll('tbody tr');
        if (rows.length >= 6) {
          // Name
          const nameLabel = rows[0].querySelector('th[scope="row"]');
          const nameValue = rows[0].querySelector('td');
          if (nameLabel) nameLabel.textContent = t('Name', 'الاسم');
          if (nameValue) {
            nameValue.textContent = t('John Michael Rivera', 'جون مايكل ريفيرا');
          }

          // ID (keep value)
          const idLabel = rows[1].querySelector('th[scope="row"]');
          if (idLabel) idLabel.textContent = t('ID', 'هوية النزيل');

          // Current status
          const statusLabelRow = rows[2].querySelector('th[scope="row"]');
          const statusValueRow = rows[2].querySelector('td');
          if (statusLabelRow) {
            statusLabelRow.textContent = t('Current status', 'الحالة الحالية');
          }
          if (statusValueRow) {
            statusValueRow.textContent = t(
              'Pre-trial hold · Medical observation',
              'احتجاز قبل المحاكمة · ملاحظة طبية'
            );
          }

          // Charges
          const chargesLabel = rows[3].querySelector('th[scope="row"]');
          const chargesValue = rows[3].querySelector('td');
          if (chargesLabel) chargesLabel.textContent = t('Charges', 'التهم');
          if (chargesValue) {
            chargesValue.textContent = t(
              'Possession · Disturbance of peace',
              'حيازة · الإخلال بالسكينة العامة'
            );
          }

          // Age (keep number)
          const ageLabelInmate = rows[4].querySelector('th[scope="row"]');
          if (ageLabelInmate) ageLabelInmate.textContent = t('Age', 'العمر');

          // Language (keep language text)
          const langLabelInmate = rows[5].querySelector('th[scope="row"]');
          if (langLabelInmate) langLabelInmate.textContent = t('Language', 'اللغة');
        }
      }

      // Back button + mode pill
      const backLabel = document.querySelector('#back-to-status span:last-child');
      if (backLabel) {
        backLabel.textContent = t('Back', 'رجوع');
      }

      const modePill = document.querySelector('.live-session-tag--soft');
      if (modePill) {
        modePill.textContent = t(
          'Mode: Prison intake · Medical checkup',
          'الوضع: استقبال السجن · فحص طبي'
        );
      }

      // Conversation & officer notes headers
      const conversationTitle = document.querySelector('.conversation-title');
      if (conversationTitle) {
        conversationTitle.textContent = t('Conversation', 'المحادثة');
      }

      const notesTitle = document.querySelector('.notes-title');
      if (notesTitle) {
        notesTitle.textContent = t('Officer notes', 'ملاحظات الضابط');
      }

      const quickActionsTitle = document.querySelector('.session-notes-title');
      if (quickActionsTitle) {
        quickActionsTitle.textContent = t('Quick actions', 'إجراءات سريعة');
      }

      const conversationSubheading = document.querySelector('.conversation-subheading');
      if (conversationSubheading) {
        conversationSubheading.textContent = t(
          'Live transcript of the officer–inmate dialogue for this session.',
          'النص الحي للمحادثة بين الضابط والنزيل في هذه الجلسة.'
        );
      }

      const notesSubheading = document.querySelector('.notes-subheading');
      if (notesSubheading) {
        notesSubheading.textContent = t(
          'Use this area to capture clinical observations, risks, and follow-up actions.',
          'استخدم هذه المساحة لتسجيل الملاحظات السريرية ومخاطر الحالة وإجراءات المتابعة.'
        );
      }

      const notesHint = document.querySelector('.session-hint');
      if (notesHint) {
        notesHint.textContent = t(
          'Notes are visible only to officers and are not read aloud or shared with the inmate.',
          'الملاحظات مرئية للضباط فقط ولا يتم قراءتها بصوت عالٍ أو مشاركتها مع النزيل.'
        );
      }

      const notesTextarea = document.querySelector('.session-notes-textarea');
      if (notesTextarea) {
        notesTextarea.placeholder = t(
          'Type officer notes here…',
          'اكتب ملاحظات الضابط هنا…'
        );
      }

      // Conversation meta (session label)
      const convoMeta = document.querySelector('.conversation-meta');
      if (convoMeta) {
        convoMeta.textContent = t(
          'Session 1 · Medical intake',
          'الجلسة 1 · فحص طبي'
        );
      }

      // Quick action buttons
      const quickActionButtons = document.querySelectorAll('.session-quick-actions .session-chip');
      if (quickActionButtons.length >= 3) {
        quickActionButtons[0].textContent = t('Flag medical risk', 'الإشارة إلى خطر طبي');
        quickActionButtons[1].textContent = t('Escalate to supervisor', 'تصعيد إلى المشرف');
        quickActionButtons[2].textContent = t('Mark for follow-up', 'وضع علامة للمتابعة');
      }

      // Mic live label
      const micStatusLabel = document.querySelector('.mic-status-label');
      if (micStatusLabel) {
        micStatusLabel.textContent = t('Live', 'مباشر');
      }

      // Subtitle text under live transcript
      const subtitleEl = document.getElementById('subtitleText');
      if (subtitleEl) {
        subtitleEl.textContent = t(
          'Live translated transcript will appear here.',
          'سيظهر النص المترجم مباشرة هنا.'
        );
      }


      // Live screen header

      const liveHeading = document.querySelector(

        '#screen-live .live-header .heading'

      );

      const liveSubheading = document.querySelector(

        '#screen-live .live-subheading'

      );

      if (liveHeading) {

        liveHeading.textContent = t(

          'Live Translation Session',

          'جلسة ترجمة حية'

        );

      }

      if (liveSubheading) {

        liveSubheading.textContent = t(

          'Guard and inmate are linked through a secure audio channel. Every utterance is translated in real time and logged for incident review.',

          'يتم ربط الضابط والنزيل بقناة صوتية آمنة، ويتم ترجمة كل جملة فورياً وتسجيلها لمراجعة الحوادث.'

        );

      }

    };



    // Always start in Arabic (RTL) on load (ignore previous choice)
    const initialLang = 'ar';
    applyUiLang(initialLang);
    // Mark that the UI language has been applied so CSS can reveal the page
    document.documentElement.classList.add('ui-lang-ready');



    uiLangToggle.addEventListener('click', () => {

      const next = (localStorage.getItem('ui_lang') || 'en') === 'en' ? 'ar' : 'en';

      applyUiLang(next);

    });



    // Mobile / tablet hamburger menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const appHeader = document.querySelector('.app-header');
    const appHeaderInner = document.getElementById('app-header-inner');
    const appShell = document.querySelector('.app-shell');

    const closeMobileMenu = () => {

      if (!appHeader || !mobileMenuToggle) return;

      appHeader.classList.remove('app-header--open');

      mobileMenuToggle.setAttribute('aria-expanded', 'false');

      document.body.classList.remove('menu-open');

    };

    if (mobileMenuToggle && appHeader) {

      mobileMenuToggle.addEventListener('click', (event) => {

        event.stopPropagation();

        const isOpen = appHeader.classList.toggle('app-header--open');

        mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        if (isOpen) {

          document.body.classList.add('menu-open');

        } else {

          document.body.classList.remove('menu-open');

        }

      });

    }

    if (appShell) {

      appShell.addEventListener('click', (event) => {

        if (!document.body.classList.contains('menu-open')) {

          return;

        }

        if (

          (appHeaderInner && appHeaderInner.contains(event.target)) ||
          (mobileMenuToggle && mobileMenuToggle.contains(event.target))

        ) {

          return;

        }

        closeMobileMenu();

      });

    }

    // Mobile identity accordions (collapsed by default)
    const identityAccordionHeaders = document.querySelectorAll(

      '.identity-accordion-header'

    );

    identityAccordionHeaders.forEach((header) => {

      const card = header.closest('.identity-accordion-card');

      if (!card) return;

      header.addEventListener('click', () => {

        const isOpen = card.classList.toggle('identity-accordion-card--open');

        // Optionally close siblings for single-open behavior
        if (isOpen) {

          document.querySelectorAll('.identity-accordion-card').forEach((other) => {

            if (other !== card) {

              other.classList.remove('identity-accordion-card--open');

            }

          });

        }

      });

    });

  }

});

