// Shared content models for navigation, cards, lessons, and static help/checker data.
// Pages render from these structures so copy changes stay mostly data-driven.
export const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'guides', label: 'Guides', icon: 'book' },
  { id: 'services', label: 'Services', icon: 'columns' },
  { id: 'help', label: 'Local Help', icon: 'pin' },
  { id: 'checker', label: 'Checker', icon: 'checkShield' },
  { id: 'games', label: 'Brain Games', icon: 'brain' },
]

export const featureCards = [
  { id: 'guides', title: 'Step-by-Step Guides', description: 'Learn how to book a doctor, check bank statements, and more.', cta: 'Go to Step-by-Step Guides', icon: 'book', tone: 'blue', large: true },
  { id: 'services', title: 'Digital Services Directory', description: 'A simple guide to Medicare, myGov, and Centrelink online.', cta: 'Go to Digital Services Directory', icon: 'building', tone: 'green' },
  { id: 'checker', title: 'Trusted Website Checker', description: 'Paste a link here to see if it is safe to click.', cta: 'Go to Trusted Website Checker', icon: 'checkShield', tone: 'purple' },
  { id: 'help', title: 'Find Local Help', description: 'Find free in-person tech support at nearby libraries and hubs.', cta: 'Go to Find Local Help', icon: 'pin', tone: 'orange' },
]

export const filters = [
  { id: 'all', label: 'All' },
  { id: 'essential', label: 'Essential Services' },
  { id: 'communication', label: 'Communication' },
  { id: 'internet', label: 'Internet Skills' },
  { id: 'safety', label: 'Safety' },
  { id: 'mobile', label: 'Mobile Devices' },
]

// Lesson bodies are the fallback/default source content.
// GuidesPage overlays translations from i18n where available, using these IDs as keys.
export const lessons = [
  {
    id: 'mygov-login',
    title: 'How to Log In to myGov',
    description: 'Learn how to safely access your myGov account to view Medicare, Centrelink, and ATO services.',
    level: 'Beginner',
    tone: 'green',
    filter: 'essential',
    icon: 'building',
    steps: [
      { title: 'Open your web browser', detail: 'Open Chrome, Safari, Edge, or Firefox on your device. You can find the browser icon on your home screen or desktop.', tip: 'Make sure you are connected to a trusted Wi-Fi network, not a public hotspot.' },
      { title: 'Go to the myGov website', detail: 'Type my.gov.au into the address bar at the top of your browser and press Enter. Always type the address yourself — never click a link from a text or email.', tip: 'The real myGov address is exactly: my.gov.au — watch for spelling mistakes.' },
      { title: 'Click "Sign in"', detail: 'On the myGov homepage, click the blue "Sign in" button in the middle of the screen.' },
      { title: 'Enter your username and password', detail: 'Type in the email address or username you used when you created your myGov account, then enter your password. Click "Sign in".' },
      { title: 'Enter your security code', detail: 'myGov will send a 6-digit code to your mobile phone by SMS. Enter that code on the screen within 5 minutes.', tip: 'If you did not receive the code, click "Resend code". Never share this code with anyone.' },
      { title: 'You are now logged in', detail: 'You will see your myGov home page showing all your linked services like Medicare and Centrelink. Click any service to open it.' },
    ],
  },
  {
    id: 'medicare-claim',
    title: 'How to Claim Medicare Online',
    description: 'Submit a Medicare claim yourself from home after a doctor visit — no paperwork needed.',
    level: 'Beginner',
    tone: 'green',
    filter: 'essential',
    icon: 'building',
    steps: [
      { title: 'Log in to myGov', detail: 'Follow the "How to Log In to myGov" lesson first. Once logged in, click on "Medicare" from your myGov home page.' },
      { title: 'Go to "Make a claim"', detail: 'In Medicare Online, look for the "Make a claim" option in the menu and click on it.' },
      { title: 'Enter the details from your receipt', detail: 'You will need your doctor\'s receipt. Enter the date of service, the amount you paid, and the service item number shown on the receipt.' },
      { title: 'Check your bank details are correct', detail: 'Medicare will refund money directly to your bank account. Check the account details shown on screen are correct. If they are wrong, update them before continuing.' },
      { title: 'Submit your claim', detail: 'Review all the details and click "Submit". You will receive a confirmation number — write it down or take a photo of the screen.' },
      { title: 'Wait for your refund', detail: 'Medicare refunds usually arrive in your bank account within 2–3 business days.', tip: 'You can check the status of your claim in the "View claim history" section of Medicare Online.' },
    ],
  },
  {
    id: 'internet-browsing',
    title: 'Safe Internet Browsing',
    description: 'Discover how to safely browse the internet and find information online without putting yourself at risk.',
    level: 'Beginner',
    tone: 'green',
    filter: 'internet',
    icon: 'globe',
    steps: [
      { title: 'Open your web browser', detail: 'A web browser is the app you use to visit websites. Common ones include Chrome (red, green, yellow, blue circle), Safari (blue compass), and Edge (blue wave).' },
      { title: 'Use the address bar to go somewhere', detail: 'The address bar is the long box at the top of your browser. Click on it, type the website address (like abc.net.au), and press Enter.' },
      { title: 'Check the padlock symbol', detail: 'Before you enter any personal details, look for a padlock icon (🔒) to the left of the address bar. This means the website is using a secure connection.', tip: 'If there is no padlock or it shows a warning, do not enter any information on that page.' },
      { title: 'Use a search engine to find information', detail: 'If you don\'t know the exact address, type your question into google.com. For example: "Medicare phone number Australia" will show you the result.' },
      { title: 'Close tabs you are not using', detail: 'Each website opens in a "tab" at the top of your browser. Click the X on a tab to close it when you are done. This keeps things tidy and helps your device run smoothly.' },
    ],
  },
  {
    id: 'online-banking',
    title: 'Checking Your Bank Balance Online',
    description: 'Learn how to safely log in to your bank\'s website and check your account balance and transactions.',
    level: 'Intermediate',
    tone: 'yellow',
    filter: 'essential',
    icon: 'building',
    steps: [
      { title: 'Find your bank\'s official website', detail: 'Search for your bank\'s name in Google, or type the address directly. For example: commbank.com.au for Commonwealth Bank, nab.com.au for NAB, or anz.com.au for ANZ.', tip: 'Never click a link in an email or text to get to your bank. Always type the address yourself.' },
      { title: 'Click "Log in" or "Sign in"', detail: 'Find the log in button, usually in the top right corner of the page. Click on it.' },
      { title: 'Enter your customer number and password', detail: 'Your customer number is on the front of your bank card or in any bank letter. Enter it carefully, then enter your internet banking password.' },
      { title: 'Complete the security check', detail: 'Your bank may send a code to your phone or ask a security question. Complete this step to finish logging in.' },
      { title: 'View your balance and transactions', detail: 'Once logged in, click on your account name to see your balance and a list of recent transactions. You can scroll down to see older ones.' },
      { title: 'Log out when finished', detail: 'Always click "Log out" or "Sign out" when you are done. Do not just close the browser window.', tip: 'Never do online banking on a public computer at a library or cafe.' },
    ],
  },
  {
    id: 'spot-scam-texts',
    title: 'How to Spot a Scam Text Message',
    description: 'Learn to identify fake text messages pretending to be from myGov, banks, or delivery companies.',
    level: 'Beginner',
    tone: 'green',
    filter: 'safety',
    icon: 'shield',
    steps: [
      { title: 'Read the message carefully', detail: 'Scam texts often create panic — they say things like "Your account is suspended" or "You have an unpaid fine". Take a breath and do not rush.' },
      { title: 'Look for spelling mistakes', detail: 'Real government and bank messages are professionally written. Look for unusual spelling, grammar errors, or awkward phrasing — these are signs of a scam.' },
      { title: 'Do not click any links', detail: 'If the text contains a link (a web address), do not click it. Scam links can take you to fake websites designed to steal your details.', tip: 'Real organisations like myGov and your bank will never ask for your password by text.' },
      { title: 'Check independently', detail: 'If you are worried the message might be real, do not reply. Instead, go to the organisation\'s official website by typing the address yourself, or call their official number.' },
      { title: 'Report the scam', detail: 'You can report scam texts to the Australian Communications and Media Authority (ACMA) at acma.gov.au/report-a-scam. This helps protect other Australians.' },
    ],
  },
  {
    id: 'smartphone-basics',
    title: 'Smartphone Basics',
    description: 'Get comfortable with the essential features of your smartphone — making calls, sending messages, and adjusting settings.',
    level: 'Beginner',
    tone: 'green',
    filter: 'mobile',
    icon: 'phone',
    steps: [
      { title: 'Turn your phone on and off', detail: 'Press and hold the power button on the side of your phone for 2–3 seconds. A menu will appear — tap "Power off" to turn it off, or "Restart" to restart it.' },
      { title: 'Make a phone call', detail: 'Tap the green phone icon on your home screen to open the dial pad. Type in the number you want to call and press the green call button. Press the red button to hang up.' },
      { title: 'Send a text message', detail: 'Tap the messages icon (usually looks like a speech bubble). Tap the pencil or "+" icon to start a new message. Type the person\'s name or number at the top, type your message, and tap Send.' },
      { title: 'Adjust your text size', detail: 'Go to Settings (the gear icon) → Display → Font size. Drag the slider to make text larger and easier to read.', tip: 'Making text larger will not change how your phone works — it just makes everything easier to see.' },
      { title: 'Connect to Wi-Fi', detail: 'Go to Settings → Wi-Fi. Make sure Wi-Fi is turned on (the toggle should be green or blue). Tap the name of your home Wi-Fi network and enter your Wi-Fi password.' },
      { title: 'Charge your phone', detail: 'Plug the charging cable into the bottom of your phone and the other end into a power adapter in the wall. A charging symbol will appear on screen. It is fine to leave it charging overnight.' },
    ],
  },
]

// Service cards stay separate from i18n because URLs/phone numbers are not language-specific.
export const serviceCards = [
  {
    title: 'myGov',
    description: 'Your secure and convenient way to access government services online in one place.',
    icon: 'building',
    tone: 'green',
    url: 'https://my.gov.au',
    phone: '132 307',
    bullets: [
      'Link Medicare, Centrelink, and ATO',
      'Check your inbox for important letters',
      'Update your details once for all services',
    ],
  },
  {
    title: 'Medicare Online',
    description: 'Manage your health care online. Claim benefits, view history, and update details.',
    icon: 'building',
    tone: 'blue',
    url: 'https://www.servicesaustralia.gov.au/medicare',
    phone: '132 011',
    bullets: [
      'Claim Medicare benefits',
      'View your immunisation history',
      'Order a replacement Medicare card',
    ],
  },
  {
    title: 'Centrelink',
    description: 'Manage your payments, report income, and access letters online.',
    icon: 'building',
    tone: 'purple',
    url: 'https://www.servicesaustralia.gov.au/centrelink',
    phone: '132 850',
    bullets: [
      'Report your employment income',
      'Apply for an Advance Payment',
      'View or request a document',
    ],
  },
  {
    title: 'My Aged Care',
    description: 'The starting point to access Australian Government-funded aged care services.',
    icon: 'building',
    tone: 'orange',
    url: 'https://www.myagedcare.gov.au',
    phone: '1800 200 422',
    bullets: [
      'Find aged care services near you',
      'Apply for an assessment online',
      'Understand costs and fees',
    ],
  },
]

// Placeholder local support locations used by the help finder UI.
export const helpPlaces = [
  { name: 'City Library - Digital Literacy Hub', distance: '1.2 km', address: '100 Main Street, Metroville 3000', hours: 'Mon-Fri: 9am - 5pm, Sat: 10am - 2pm', phone: '(03) 9999 1234', site: 'citylibrary.vic.gov.au', tags: ['1-on-1 Help', 'Group Classes', 'Free Wi-Fi', 'Device Loaning'] },
  { name: 'Community Centre East', distance: '3.5 km', address: '45 East Avenue, Metroville 3001', hours: 'Tue, Thu: 10am - 3pm', phone: '(03) 9888 5678', site: 'communityeast.org.au', tags: ['1-on-1 Help', 'Smartphone Basics'] },
  { name: 'Seniors Tech Hub South', distance: '5.0 km', address: '12 South Road, Metroville 3002', hours: 'Mon-Fri: 10am - 4pm', phone: '(03) 9777 9012', site: 'seniorstechsouth.org.au', tags: ['iPad Classes', 'Scam Awareness Workshops'] },
]

// Lightweight static tips shown below the URL checker result card.
export const checkerTips = [
  { title: 'Look for official endings', description: 'Real Australian government sites always end in .gov.au (like my.gov.au or ato.gov.au).' },
  { title: 'Watch for spelling mistakes', description: 'Scammers often use numbers instead of letters, like myg0v instead of mygov, or add extra words like mygov-update.' },
  { title: 'Never trust unexpected texts', description: "If you receive a text with a link about a toll fine, package delivery, or bank issue out of the blue, it's almost certainly a scam. Do not click the link." },
]
