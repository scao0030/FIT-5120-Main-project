export const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'guides', label: 'Guides', icon: 'book' },
  { id: 'services', label: 'Services', icon: 'columns' },
  { id: 'scams', label: 'Scams', icon: 'shield' },
  { id: 'help', label: 'Local Help', icon: 'pin' },
  { id: 'checker', label: 'Checker', icon: 'checkShield' },
]

export const featureCards = [
  { id: 'guides', title: 'Step-by-Step Guides', description: 'Learn how to book a doctor, check bank statements, and more.', cta: 'Go to Step-by-Step Guides', icon: 'book', tone: 'blue', large: true },
  { id: 'services', title: 'Digital Services Directory', description: 'A simple guide to Medicare, myGov, and Centrelink online.', cta: 'Go to Digital Services Directory', icon: 'building', tone: 'green' },
  { id: 'scams', title: 'Scam Alerts', description: 'Learn to spot fake texts, emails, and phone calls.', cta: 'Go to Scam Alerts', icon: 'shieldAlert', tone: 'red' },
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

export const lessons = [
  { title: 'Internet Browsing', description: 'Discover how to safely browse the internet and find information online.', level: 'Beginner', tone: 'green', filter: 'internet', icon: 'globe' },
  { title: 'Online Shopping', description: 'Learn to shop online safely and find great deals from the comfort of home.', level: 'Intermediate', tone: 'yellow', filter: 'internet', icon: 'cart' },
  { title: 'Effective Internet Searching', description: "Find exactly what you're looking for online with smart search techniques.", level: 'Intermediate', tone: 'yellow', filter: 'internet', icon: 'search' },
]

export const serviceCards = [
  { title: 'myGov', description: 'Your secure and convenient way to access government services online in one place.', icon: 'building', tone: 'green', bullets: ['Link Medicare, Centrelink, and ATO', 'Check your inbox for important letters', 'Update your details once for all services'] },
  { title: 'Medicare Online', description: 'Manage your health care online. Claim benefits, view history, and update details.', icon: 'building', tone: 'blue', bullets: ['Claim Medicare benefits', 'View your immunisation history', 'Order a replacement Medicare card'] },
  { title: 'Centrelink', description: 'Manage your payments, report income, and access letters online.', icon: 'building', tone: 'purple', bullets: ['Report your employment income', 'Apply for an Advance Payment', 'View or request a document'] },
  { title: 'My Aged Care', description: 'The starting point to access Australian Government-funded aged care services.', icon: 'building', tone: 'orange', bullets: ['Find aged care services near you', 'Apply for an assessment online', 'Understand costs and fees'] },
]

export const scamCards = [
  { type: 'SMS PHISHING', title: 'Fake myGov Text Messages', description: 'Scammers are sending text messages pretending to be from myGov, claiming you have a refund or need to verify your details. Do not click the link.', advice: 'Log into your myGov account independently by typing my.gov.au into your browser.', icon: 'phone' },
  { type: 'PHONE SCAM', title: 'Bank Impersonation Calls', description: "You receive a phone call from someone claiming to be from your bank's fraud team. They ask for your password or a one-time code to stop a transaction.", advice: 'Hang up immediately. Call your bank using the phone number on the back of your bank card.', icon: 'phone' },
  { type: 'EMAIL PHISHING', title: 'Toll Road Fines Email', description: "Emails claiming you have an unpaid toll notice with Linkt or other providers, threatening late fees if you don't pay via a provided link.", advice: 'Do not pay. Log into your toll account directly or check your vehicle registration online.', icon: 'mail' },
  { type: 'WEBSITE SCAM', title: 'Fake Tech Support Pop-ups', description: 'A loud warning appears on your computer screen saying it has a virus and urging you to call a support number to fix it.', advice: 'Do not call the number. Close your browser completely or turn off your computer.', icon: 'globe' },
]

export const helpPlaces = [
  { name: 'City Library - Digital Literacy Hub', distance: '1.2 km', address: '100 Main Street, Metroville 3000', hours: 'Mon-Fri: 9am - 5pm, Sat: 10am - 2pm', phone: '(03) 9999 1234', site: 'citylibrary.vic.gov.au', tags: ['1-on-1 Help', 'Group Classes', 'Free Wi-Fi', 'Device Loaning'] },
  { name: 'Community Centre East', distance: '3.5 km', address: '45 East Avenue, Metroville 3001', hours: 'Tue, Thu: 10am - 3pm', phone: '(03) 9888 5678', site: 'communityeast.org.au', tags: ['1-on-1 Help', 'Smartphone Basics'] },
  { name: 'Seniors Tech Hub South', distance: '5.0 km', address: '12 South Road, Metroville 3002', hours: 'Mon-Fri: 10am - 4pm', phone: '(03) 9777 9012', site: 'seniorstechsouth.org.au', tags: ['iPad Classes', 'Scam Awareness Workshops'] },
]

export const checkerTips = [
  { title: 'Look for official endings', description: 'Real Australian government sites always end in .gov.au (like my.gov.au or ato.gov.au).' },
  { title: 'Watch for spelling mistakes', description: 'Scammers often use numbers instead of letters, like myg0v instead of mygov, or add extra words like mygov-update.' },
  { title: 'Never trust unexpected texts', description: "If you receive a text with a link about a toll fine, package delivery, or bank issue out of the blue, it's almost certainly a scam. Do not click the link." },
]
