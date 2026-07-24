(() => {
  'use strict';

  const EVENT_DATE_UTC = '2026-10-08T09:30:00Z';
  const EVENT_DATE = new Date(EVENT_DATE_UTC);

  /* ---------- Countdown timer (all instances, via class) ---------- */
  const cdDaysEls = document.querySelectorAll('.cd-days');
  const cdHoursEls = document.querySelectorAll('.cd-hours');
  const cdMinutesEls = document.querySelectorAll('.cd-minutes');
  const cdSecondsEls = document.querySelectorAll('.cd-seconds');

  if (cdDaysEls.length) {
    const target = EVENT_DATE.getTime();
    const pad = (n) => String(n).padStart(2, '0');
    const setAll = (nodeList, text) => nodeList.forEach((el) => { el.textContent = text; });
    let timer;

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setAll(cdDaysEls, '00');
        setAll(cdHoursEls, '00');
        setAll(cdMinutesEls, '00');
        setAll(cdSecondsEls, '00');
        if (timer) clearInterval(timer);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setAll(cdDaysEls, pad(Math.floor(totalSeconds / 86400)));
      setAll(cdHoursEls, pad(Math.floor((totalSeconds % 86400) / 3600)));
      setAll(cdMinutesEls, pad(Math.floor((totalSeconds % 3600) / 60)));
      setAll(cdSecondsEls, pad(totalSeconds % 60));
    };

    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- Event date/time formatting + local-timezone toggle ---------- */
  const TZ_ABBR = {
    'Asia/Kolkata': 'IST', 'Asia/Calcutta': 'IST',
    'America/New_York': 'EDT', 'America/Toronto': 'EDT',
    'America/Chicago': 'CDT', 'America/Mexico_City': 'CST',
    'America/Denver': 'MDT',
    'America/Los_Angeles': 'PDT', 'America/Vancouver': 'PDT',
    'America/Anchorage': 'AKDT', 'Pacific/Honolulu': 'HST',
    'America/Sao_Paulo': 'BRT',
    'Europe/London': 'BST', 'Europe/Dublin': 'IST',
    'Europe/Paris': 'CEST', 'Europe/Berlin': 'CEST', 'Europe/Madrid': 'CEST',
    'Europe/Rome': 'CEST', 'Europe/Amsterdam': 'CEST', 'Europe/Brussels': 'CEST',
    'Europe/Zurich': 'CEST', 'Europe/Athens': 'EEST', 'Europe/Helsinki': 'EEST',
    'Europe/Bucharest': 'EEST', 'Europe/Moscow': 'MSK',
    'Africa/Cairo': 'EET', 'Africa/Johannesburg': 'SAST',
    'Asia/Dubai': 'GST', 'Asia/Riyadh': 'AST', 'Asia/Karachi': 'PKT',
    'Asia/Dhaka': 'BST', 'Asia/Bangkok': 'ICT', 'Asia/Jakarta': 'WIB',
    'Asia/Shanghai': 'CST', 'Asia/Hong_Kong': 'HKT', 'Asia/Tokyo': 'JST',
    'Asia/Seoul': 'KST', 'Asia/Singapore': 'SGT', 'Asia/Kuala_Lumpur': 'MYT',
    'Asia/Manila': 'PHT',
    'Australia/Sydney': 'AEDT', 'Australia/Melbourne': 'AEDT',
    'Australia/Brisbane': 'AEST', 'Australia/Perth': 'AWST',
    'Australia/Adelaide': 'ACDT', 'Pacific/Auckland': 'NZDT',
  };

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const formatInZone = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).formatToParts(date);
    const get = (type) => (parts.find((p) => p.type === type) || {}).value || '';
    const day = get('day');
    const month = MONTHS[parseInt(get('month'), 10) - 1];
    const year = get('year');
    const hour = get('hour').padStart(2, '0');
    const minute = get('minute');
    const dayPeriod = get('dayPeriod').toUpperCase();
    return `${day} ${month}, ${year} ${hour}:${minute} ${dayPeriod}`;
  };

  const getZoneAbbr = (date, timeZone) => {
    if (TZ_ABBR[timeZone]) return TZ_ABBR[timeZone];
    try {
      const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName');
      return part ? part.value.replace('GMT', 'UTC') : timeZone;
    } catch (e) {
      return timeZone;
    }
  };

  const dateTimeEls = document.querySelectorAll('.event-datetime');
  const tzButtons = document.querySelectorAll('.tz-toggle-btn');

  if (dateTimeEls.length) {
    const utcText = `${formatInZone(EVENT_DATE, 'UTC')} UTC`;
    let localText = null;
    try {
      const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      localText = `${formatInZone(EVENT_DATE, localZone)} ${getZoneAbbr(EVENT_DATE, localZone)}`;
    } catch (e) {
      localText = null;
    }

    dateTimeEls.forEach((el) => { el.textContent = utcText; });

    if (localText && tzButtons.length) {
      let showingLocal = false;
      const applyTzState = () => {
        const text = showingLocal ? localText : utcText;
        const label = showingLocal ? 'View in UTC' : 'View in my timezone';
        dateTimeEls.forEach((el) => { el.textContent = text; });
        tzButtons.forEach((btn) => {
          const labelEl = btn.querySelector('.tz-toggle-label');
          if (labelEl) labelEl.textContent = label;
          btn.setAttribute('aria-label', label);
          btn.setAttribute('aria-pressed', String(showingLocal));
        });
      };
      tzButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          showingLocal = !showingLocal;
          applyTzState();
        });
      });
    } else {
      tzButtons.forEach((btn) => { btn.hidden = true; });
    }
  }

  /* ---------- Add to calendar ---------- */
  const addCalBtn = document.getElementById('addToCalendarBtn');
  const addCalMenu = document.getElementById('addToCalendarMenu');

  if (addCalBtn && addCalMenu) {
    const startDate = EVENT_DATE;
    const endDate = new Date(EVENT_DATE.getTime() + 60 * 60 * 1000);
    const pad2 = (n) => String(n).padStart(2, '0');
    const toCompactUTC = (d) =>
      `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;

    const title = 'APAC Data Centre Leadership Summit 2026';
    const description = "A closed-door executive briefing on the AI, sovereignty and energy decisions shaping APAC's infrastructure. Hosted by NTT GDC. Join link sent on registration.";
    const location = 'Virtual — join link sent on registration';

    const startCompact = toCompactUTC(startDate);
    const endCompact = toCompactUTC(endDate);

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startCompact}/${endCompact}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NTT GDC//APAC Summit 2026//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:ntt-gdc-apac-summit-2026@nttdata.com',
      `DTSTAMP:${toCompactUTC(new Date())}`,
      `DTSTART:${startCompact}`,
      `DTEND:${endCompact}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/,/g, '\\,')}`,
      `LOCATION:${location.replace(/,/g, '\\,')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const googleLink = document.getElementById('calGoogle');
    const outlookLink = document.getElementById('calOutlook');
    const icsLink = document.getElementById('calIcs');

    if (googleLink) googleLink.href = googleUrl;
    if (outlookLink) outlookLink.href = outlookUrl;
    if (icsLink) icsLink.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

    const closeCalMenu = () => {
      addCalMenu.hidden = true;
      addCalBtn.setAttribute('aria-expanded', 'false');
    };
    const openCalMenu = () => {
      addCalMenu.hidden = false;
      addCalBtn.setAttribute('aria-expanded', 'true');
    };

    addCalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (addCalMenu.hidden) openCalMenu(); else closeCalMenu();
    });

    document.addEventListener('click', (e) => {
      if (!addCalMenu.hidden && !addCalMenu.contains(e.target) && e.target !== addCalBtn) {
        closeCalMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !addCalMenu.hidden) {
        closeCalMenu();
        addCalBtn.focus();
      }
    });
  }

  /* ---------- Brand-guideline mode toggle ---------- */
  const brandToggle = document.getElementById('brandToggle');
  const brandToggleLabel = document.getElementById('brandToggleLabel');

  const applyBrandMode = (on) => {
    document.documentElement.classList.toggle('brand-mode', on);
    brandToggle.setAttribute('aria-pressed', String(on));
    brandToggleLabel.textContent = on ? 'Switch to original' : 'Switch to brand guidelines';
  };

  if (brandToggle) {
    // Brand-guidelines version is now the fixed live default (toggle button hidden,
    // logic kept intact in case it needs to be re-enabled later).
    applyBrandMode(true);

    brandToggle.addEventListener('click', () => {
      const next = document.documentElement.classList.contains('brand-mode') ? false : true;
      applyBrandMode(next);
      localStorage.setItem('brandMode', String(next));
    });
  }

  /* ---------- About section: new vs classic design switch ---------- */
  const aboutNewBtn = document.getElementById('aboutVersionNewBtn');
  const aboutClassicBtn = document.getElementById('aboutVersionClassicBtn');
  const aboutNewPanel = document.getElementById('aboutVersionNew');
  const aboutClassicPanel = document.getElementById('aboutVersionClassic');

  if (aboutNewBtn && aboutClassicBtn) {
    const showAboutVersion = (version) => {
      const showNew = version === 'new';
      aboutNewPanel.hidden = !showNew;
      aboutClassicPanel.hidden = showNew;
      aboutNewBtn.classList.toggle('is-active', showNew);
      aboutClassicBtn.classList.toggle('is-active', !showNew);
    };
    aboutNewBtn.addEventListener('click', () => showAboutVersion('new'));
    aboutClassicBtn.addEventListener('click', () => showAboutVersion('classic'));
  }

  /* ---------- Mobile section-menu dropdown ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('main-nav');

  const closeMobileNav = () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        closeMobileNav();
        navToggle.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (
        mainNav.classList.contains('is-open') &&
        !mainNav.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeMobileNav();
      }
    });
  }

  /* ---------- Back to top ---------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggleVisibility = () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Registration drawer ---------- */
  const regDrawer = document.getElementById('regDrawer');
  const regBackdrop = document.getElementById('regBackdrop');
  const regDrawerClose = document.getElementById('regDrawerClose');
  let lastFocusedEl = null;

  const openDrawer = () => {
    lastFocusedEl = document.activeElement;
    regDrawer.classList.add('is-open');
    regBackdrop.classList.add('is-open');
    regDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstField = regDrawer.querySelector('.reg-drawer-body input');
    if (firstField) firstField.focus();
  };

  const closeDrawer = () => {
    regDrawer.classList.remove('is-open');
    regBackdrop.classList.remove('is-open');
    regDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  };

  document.querySelectorAll('.js-open-register').forEach((btn) => {
    btn.addEventListener('click', openDrawer);
  });

  if (regDrawerClose) regDrawerClose.addEventListener('click', closeDrawer);
  if (regBackdrop) regBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && regDrawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  /* ---------- Country select options ---------- */
  const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
    'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
    'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
    'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
    'Cameroon', 'Canada', 'Cabo Verde', 'Central African Republic', 'Chad', 'Chile',
    'China', 'Colombia', 'Comoros', 'Congo (DRC)', 'Congo (Republic)', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
    'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
    'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland',
    'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
    'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
    'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
    'Luxembourg', 'Macao', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
    'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
    'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
    'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
    'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
    'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Samoa',
    'San Marino', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
    'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
    'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden',
    'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste',
    'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
    'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
    'Zambia', 'Zimbabwe',
  ];

  document.querySelectorAll('.js-country-select').forEach((select) => {
    COUNTRIES.forEach((country) => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      select.appendChild(option);
    });
  });

  /* ---------- Phone field: country dial-code select, auto-detected ---------- */
  const PHONE_COUNTRIES = [
    ['AF', 'Afghanistan', '93'], ['AL', 'Albania', '355'], ['DZ', 'Algeria', '213'],
    ['AD', 'Andorra', '376'], ['AO', 'Angola', '244'], ['AR', 'Argentina', '54'],
    ['AM', 'Armenia', '374'], ['AU', 'Australia', '61'], ['AT', 'Austria', '43'],
    ['AZ', 'Azerbaijan', '994'], ['BS', 'Bahamas', '1'], ['BH', 'Bahrain', '973'],
    ['BD', 'Bangladesh', '880'], ['BB', 'Barbados', '1'], ['BY', 'Belarus', '375'],
    ['BE', 'Belgium', '32'], ['BZ', 'Belize', '501'], ['BJ', 'Benin', '229'],
    ['BT', 'Bhutan', '975'], ['BO', 'Bolivia', '591'], ['BA', 'Bosnia and Herzegovina', '387'],
    ['BW', 'Botswana', '267'], ['BR', 'Brazil', '55'], ['BN', 'Brunei', '673'],
    ['BG', 'Bulgaria', '359'], ['BF', 'Burkina Faso', '226'], ['BI', 'Burundi', '257'],
    ['KH', 'Cambodia', '855'], ['CM', 'Cameroon', '237'], ['CA', 'Canada', '1'],
    ['CV', 'Cabo Verde', '238'], ['CF', 'Central African Republic', '236'], ['TD', 'Chad', '235'],
    ['CL', 'Chile', '56'], ['CN', 'China', '86'], ['CO', 'Colombia', '57'],
    ['KM', 'Comoros', '269'], ['CD', 'Congo (DRC)', '243'], ['CG', 'Congo (Republic)', '242'],
    ['CR', 'Costa Rica', '506'], ['HR', 'Croatia', '385'], ['CU', 'Cuba', '53'],
    ['CY', 'Cyprus', '357'], ['CZ', 'Czechia', '420'], ['DK', 'Denmark', '45'],
    ['DJ', 'Djibouti', '253'], ['DM', 'Dominica', '1'], ['DO', 'Dominican Republic', '1'],
    ['EC', 'Ecuador', '593'], ['EG', 'Egypt', '20'], ['SV', 'El Salvador', '503'],
    ['GQ', 'Equatorial Guinea', '240'], ['ER', 'Eritrea', '291'], ['EE', 'Estonia', '372'],
    ['SZ', 'Eswatini', '268'], ['ET', 'Ethiopia', '251'], ['FJ', 'Fiji', '679'],
    ['FI', 'Finland', '358'], ['FR', 'France', '33'], ['GA', 'Gabon', '241'],
    ['GM', 'Gambia', '220'], ['GE', 'Georgia', '995'], ['DE', 'Germany', '49'],
    ['GH', 'Ghana', '233'], ['GR', 'Greece', '30'], ['GD', 'Grenada', '1'],
    ['GT', 'Guatemala', '502'], ['GN', 'Guinea', '224'], ['GW', 'Guinea-Bissau', '245'],
    ['GY', 'Guyana', '592'], ['HT', 'Haiti', '509'], ['HN', 'Honduras', '504'],
    ['HK', 'Hong Kong', '852'], ['HU', 'Hungary', '36'], ['IS', 'Iceland', '354'],
    ['IN', 'India', '91'], ['ID', 'Indonesia', '62'], ['IR', 'Iran', '98'],
    ['IQ', 'Iraq', '964'], ['IE', 'Ireland', '353'], ['IL', 'Israel', '972'],
    ['IT', 'Italy', '39'], ['JM', 'Jamaica', '1'], ['JP', 'Japan', '81'],
    ['JO', 'Jordan', '962'], ['KZ', 'Kazakhstan', '7'], ['KE', 'Kenya', '254'],
    ['KI', 'Kiribati', '686'], ['KW', 'Kuwait', '965'], ['KG', 'Kyrgyzstan', '996'],
    ['LA', 'Laos', '856'], ['LV', 'Latvia', '371'], ['LB', 'Lebanon', '961'],
    ['LS', 'Lesotho', '266'], ['LR', 'Liberia', '231'], ['LY', 'Libya', '218'],
    ['LI', 'Liechtenstein', '423'], ['LT', 'Lithuania', '370'], ['LU', 'Luxembourg', '352'],
    ['MO', 'Macao', '853'], ['MG', 'Madagascar', '261'], ['MW', 'Malawi', '265'],
    ['MY', 'Malaysia', '60'], ['MV', 'Maldives', '960'], ['ML', 'Mali', '223'],
    ['MT', 'Malta', '356'], ['MH', 'Marshall Islands', '692'], ['MR', 'Mauritania', '222'],
    ['MU', 'Mauritius', '230'], ['MX', 'Mexico', '52'], ['FM', 'Micronesia', '691'],
    ['MD', 'Moldova', '373'], ['MC', 'Monaco', '377'], ['MN', 'Mongolia', '976'],
    ['ME', 'Montenegro', '382'], ['MA', 'Morocco', '212'], ['MZ', 'Mozambique', '258'],
    ['MM', 'Myanmar', '95'], ['NA', 'Namibia', '264'], ['NR', 'Nauru', '674'],
    ['NP', 'Nepal', '977'], ['NL', 'Netherlands', '31'], ['NZ', 'New Zealand', '64'],
    ['NI', 'Nicaragua', '505'], ['NE', 'Niger', '227'], ['NG', 'Nigeria', '234'],
    ['KP', 'North Korea', '850'], ['MK', 'North Macedonia', '389'], ['NO', 'Norway', '47'],
    ['OM', 'Oman', '968'], ['PK', 'Pakistan', '92'], ['PW', 'Palau', '680'],
    ['PS', 'Palestine', '970'], ['PA', 'Panama', '507'], ['PG', 'Papua New Guinea', '675'],
    ['PY', 'Paraguay', '595'], ['PE', 'Peru', '51'], ['PH', 'Philippines', '63'],
    ['PL', 'Poland', '48'], ['PT', 'Portugal', '351'], ['QA', 'Qatar', '974'],
    ['RO', 'Romania', '40'], ['RU', 'Russia', '7'], ['RW', 'Rwanda', '250'],
    ['WS', 'Samoa', '685'], ['SM', 'San Marino', '378'], ['SA', 'Saudi Arabia', '966'],
    ['SN', 'Senegal', '221'], ['RS', 'Serbia', '381'], ['SC', 'Seychelles', '248'],
    ['SL', 'Sierra Leone', '232'], ['SG', 'Singapore', '65'], ['SK', 'Slovakia', '421'],
    ['SI', 'Slovenia', '386'], ['SB', 'Solomon Islands', '677'], ['SO', 'Somalia', '252'],
    ['ZA', 'South Africa', '27'], ['KR', 'South Korea', '82'], ['SS', 'South Sudan', '211'],
    ['ES', 'Spain', '34'], ['LK', 'Sri Lanka', '94'], ['SD', 'Sudan', '249'],
    ['SR', 'Suriname', '597'], ['SE', 'Sweden', '46'], ['CH', 'Switzerland', '41'],
    ['SY', 'Syria', '963'], ['TW', 'Taiwan', '886'], ['TJ', 'Tajikistan', '992'],
    ['TZ', 'Tanzania', '255'], ['TH', 'Thailand', '66'], ['TL', 'Timor-Leste', '670'],
    ['TG', 'Togo', '228'], ['TO', 'Tonga', '676'], ['TT', 'Trinidad and Tobago', '1'],
    ['TN', 'Tunisia', '216'], ['TR', 'Turkey', '90'], ['TM', 'Turkmenistan', '993'],
    ['TV', 'Tuvalu', '688'], ['UG', 'Uganda', '256'], ['UA', 'Ukraine', '380'],
    ['AE', 'United Arab Emirates', '971'], ['GB', 'United Kingdom', '44'], ['US', 'United States', '1'],
    ['UY', 'Uruguay', '598'], ['UZ', 'Uzbekistan', '998'], ['VU', 'Vanuatu', '678'],
    ['VA', 'Vatican City', '379'], ['VE', 'Venezuela', '58'], ['VN', 'Vietnam', '84'],
    ['YE', 'Yemen', '967'], ['ZM', 'Zambia', '260'], ['ZW', 'Zimbabwe', '263'],
  ];

  const flagUrl = (iso2) => `https://flagcdn.com/${iso2.toLowerCase()}.svg`;

  const setPhoneFlag = (select) => {
    const img = select.parentElement.querySelector('.js-phone-flag-img');
    if (!img) return;
    const [, name] = PHONE_COUNTRIES.find(([iso2]) => iso2 === select.value) || [];
    img.src = flagUrl(select.value);
    img.alt = name ? `${name} flag` : '';
    img.onerror = () => { img.style.visibility = 'hidden'; };
    img.onload = () => { img.style.visibility = 'visible'; };
  };

  const phoneCountrySelects = document.querySelectorAll('.js-phone-country');
  if (phoneCountrySelects.length) {
    const sortedPhoneCountries = [...PHONE_COUNTRIES].sort((a, b) => a[1].localeCompare(b[1]));

    phoneCountrySelects.forEach((select) => {
      sortedPhoneCountries.forEach(([iso2, name, dial]) => {
        const option = document.createElement('option');
        option.value = iso2;
        option.textContent = `${iso2} (+${dial})`;
        option.title = `${name} (+${dial})`;
        select.appendChild(option);
      });
      select.addEventListener('change', () => setPhoneFlag(select));
    });

    const detectPhoneCountry = () => {
      const candidates = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || 'en-US'];
      for (const lang of candidates) {
        let region = '';
        try {
          region = new Intl.Locale(lang).maximize().region || '';
        } catch (e) {
          const parts = lang.split('-');
          region = parts.length > 1 && /^[a-zA-Z]{2}$/.test(parts[1]) ? parts[1].toUpperCase() : '';
        }
        if (region && PHONE_COUNTRIES.some(([iso2]) => iso2 === region)) return region;
      }
      return 'US';
    };

    const defaultPhoneCountry = detectPhoneCountry();
    phoneCountrySelects.forEach((select) => {
      select.value = defaultPhoneCountry;
      if (!select.value) select.value = 'US';
      setPhoneFlag(select);
    });
  }

  /* ---------- Shared registration form logic ---------- */
  // Both the inline "register" section and the drawer submit into the same
  // conceptual registration; a successful submit from either shows the
  // success state in both places at once.
  const validators = {
    fullName: (v) => (v.trim().length >= 2 ? '' : 'Enter your full name.'),
    company: (v) => (v.trim().length >= 2 ? '' : 'Enter your company name.'),
    designation: (v) => (v.trim().length >= 2 ? '' : 'Enter your designation.'),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    country: (v) => (v.trim().length > 0 ? '' : 'Select your country.'),
    phone: (v) => {
      const digits = v.replace(/\D/g, '');
      return digits.length >= 6 && digits.length <= 14 ? '' : 'Enter a valid phone number.';
    },
  };

  const setupForm = (form, { alertId, optInErrorId, onSuccess }) => {
    if (!form) return;
    const alertBox = document.getElementById(alertId);

    const validateField = (input) => {
      const rule = validators[input.name];
      if (!rule) return true;
      const message = rule(input.value);
      const errorEl = document.getElementById(`err-${input.id}`);
      if (message) {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = message;
        return false;
      }
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
      if (errorEl) errorEl.textContent = '';
      return true;
    };

    const validateOptIn = () => {
      const checkbox = form.querySelector('input[name="optIn"]');
      const errorEl = document.getElementById(optInErrorId);
      if (!checkbox.checked) {
        if (errorEl) errorEl.textContent = 'Please confirm to continue.';
        return false;
      }
      if (errorEl) errorEl.textContent = '';
      return true;
    };

    Object.keys(validators).forEach((name) => {
      const input = form.elements[name];
      if (input) {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('invalid')) validateField(input);
        });
      }
    });

    const optInCheckbox = form.querySelector('input[name="optIn"]');
    if (optInCheckbox) {
      optInCheckbox.addEventListener('change', () => {
        const errorEl = document.getElementById(optInErrorId);
        if (optInCheckbox.checked && errorEl) errorEl.textContent = '';
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      Object.keys(validators).forEach((name) => {
        const input = form.elements[name];
        if (input && !validateField(input)) isValid = false;
      });
      if (!validateOptIn()) isValid = false;

      if (!isValid) {
        if (alertBox) alertBox.hidden = false;
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) {
          firstInvalid.focus();
        } else {
          const optInEl = document.getElementById(optInErrorId);
          if (optInEl && optInEl.textContent) optInEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      if (alertBox) alertBox.hidden = true;
      form.classList.add('is-loading');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      // Simulated submission — this is a design preview with no backend.
      setTimeout(() => {
        form.classList.remove('is-loading');
        onSuccess();
      }, 900);
    });
  };

  const showSuccessEverywhere = () => {
    // Inline section
    const inlineFields = document.getElementById('formFields');
    const inlineSuccess = document.getElementById('formSuccess');
    if (inlineFields) inlineFields.hidden = true;
    if (inlineSuccess) inlineSuccess.hidden = false;

    // Drawer
    const drawerForm = document.getElementById('drawerForm');
    const drawerSuccess = document.getElementById('drawerSuccess');
    if (drawerForm) drawerForm.hidden = true;
    if (drawerSuccess) {
      drawerSuccess.hidden = false;
      drawerSuccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  setupForm(document.getElementById('registerForm'), {
    alertId: 'formAlert',
    optInErrorId: 'err-optIn',
    onSuccess: showSuccessEverywhere,
  });

  setupForm(document.getElementById('drawerForm'), {
    alertId: 'drawerAlert',
    optInErrorId: 'err-d-optIn',
    onSuccess: showSuccessEverywhere,
  });

  const drawerSuccessClose = document.getElementById('drawerSuccessClose');
  if (drawerSuccessClose) drawerSuccessClose.addEventListener('click', closeDrawer);
})();
