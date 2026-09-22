// SellerFlow Centralized Ghanaian Languages Translation Engine
// Supports all 20 major Ghanaian languages with English fallback

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', region: 'National' },
  { code: 'tw', name: 'Twi', native: 'Twi (Asante / Akuapem)', region: 'Ashanti / Eastern' },
  { code: 'gpe', name: 'Ghanaian Pidgin', native: 'Ghanaian Pidgin English', region: 'Urban Ghana' },
  { code: 'fat', name: 'Fante', native: 'Mfantse / Fante', region: 'Central / Western' },
  { code: 'gaa', name: 'Ga', native: 'Ga', region: 'Greater Accra' },
  { code: 'ee', name: 'Ewe', native: 'Eʋegbe / Ewe', region: 'Volta' },
  { code: 'dag', name: 'Dagbani', native: 'Dagbanli / Dagbani', region: 'Northern' },
  { code: 'ha', name: 'Hausa', native: 'Hausa', region: 'Zongo / Northern' },
  { code: 'nzi', name: 'Nzema', native: 'Nzema', region: 'Western' },
  { code: 'dga', name: 'Dagaare', native: 'Dagaare', region: 'Upper West' },
  { code: 'gon', name: 'Gonja', native: 'Gonja / Ngbanya', region: 'Savannah' },
  { code: 'kss', name: 'Kasem', native: 'Kasem', region: 'Upper East' },
  { code: 'gur', name: 'Gurene (Frafra)', native: 'Gurenɛ / Frafra', region: 'Upper East' },
  { code: 'mma', name: 'Mampruli', native: 'Mampruli', region: 'North East' },
  { code: 'wal', name: 'Wali', native: 'Waali', region: 'Upper West' },
  { code: 'bis', name: 'Bissa', native: 'Bissa / Barka', region: 'Upper East' },
  { code: 'kus', name: 'Kusaal', native: 'Kusaal', region: 'Upper East / Kusaug' },
  { code: 'kdz', name: 'Konkomba', native: 'Likpakpaln / Konkomba', region: 'Northern / Oti' },
  { code: 'sil', name: 'Sisala', native: 'Sisaala', region: 'Upper West' },
  { code: 'ada', name: 'Dangme', native: 'Dangme / Adangme', region: 'Greater Accra / Eastern' }
];

const translations = {
  en: {
    app_name: "SellerFlow",
    tagline: "Ghana’s social selling marketplace.",
    nav_for_you: "For You",
    nav_dashboard: "Dashboard",
    nav_marketplace: "Marketplace",
    nav_products: "Products",
    nav_orders: "Orders",
    nav_store: "Store",
    nav_analysis: "Analysis",
    nav_profile: "Profile",
    nav_settings: "Settings",
    nav_chats: "Chats",
    nav_cart: "Cart",
    nav_jobs: "Jobs",
    nav_events: "Events",
    nav_admin: "Admin",
    nav_back: "← Back",
    nav_signin_register: "Sign In / Register",
    nav_signout: "Sign Out",
    
    title_for_you: "For You",
    title_marketplace: "Marketplace",
    title_products: "Products",
    title_orders: "Orders",
    title_store: "Store",
    title_analysis: "Analysis",
    title_profile: "Profile",
    title_settings: "Settings",
    title_chats: "Chats",
    title_cart: "Cart",
    title_jobs: "Jobs & Careers",
    title_events: "Events & Gatherings",
    title_notifications: "Notifications",
    title_dashboard: "Seller Dashboard",
    
    sub_for_you: "Watch product videos and discover top Ghanaian sellers.",
    sub_marketplace: "Explore authentic Ghanaian items, food, fashion and crafts.",
    sub_products: "Manage your inventory, prices and product listings.",
    sub_orders: "Track your active orders and delivery history.",
    sub_store: "Customize your store branding, banner and catalogue.",
    sub_analysis: "View store performance, analytics, orders and reel engagement.",
    sub_profile: "Manage your account details and profile picture.",
    sub_settings: "Manage your account, language, notifications and verification.",
    sub_chats: "Chat directly with buyers and verified Ghanaian sellers.",
    sub_cart: "Review your items and proceed to secure checkout.",
    sub_jobs: "Discover verified career opportunities and post job openings in Ghana.",
    sub_events: "Find and host conferences, pop-up markets, workshops and social events.",
    
    auth_create_account: "Create your account",
    auth_welcome_back: "Welcome back",
    auth_sell_and_shop: "Sell and shop across Ghana.",
    auth_signin_continue: "Sign in to continue.",
    auth_fullname: "Full name",
    auth_username: "Username",
    auth_email: "Email",
    auth_password: "Password",
    auth_terms_agree: "I agree to the SellerFlow Terms & Conditions and understand that I must use the platform lawfully.",
    auth_btn_create: "Create account",
    auth_btn_signin: "Sign in",
    auth_continue_google: "Continue with Google",
    auth_forgot_password: "Forgot password?",
    auth_switch_signin: "Already have an account? Sign in",
    auth_switch_register: "New here? Create an account",
    auth_back_feed: "← Back to For You",
    auth_verify_title: "Verify your email",
    auth_verify_sub: "Check your inbox for a verification email.",
    auth_verify_sent_to: "We've sent a verification email to",
    auth_verify_check: "Check verification",
    auth_verify_resend: "Resend email",
    auth_verify_change_email: "Change email / Sign in with another account",
    
    settings_account_notif: "Account & notifications",
    settings_language: "Language",
    settings_language_desc: "Choose your preferred Ghanaian language.",
    settings_change_language: "Change Language",
    settings_notifications: "Background Browser Notifications",
    settings_tutorial: "App Tutorial & Feature Guide",
    settings_terms: "Terms & Conditions",
    settings_identity_verif: "Seller identity verification",
    settings_start_verif: "Start Ghana Card verification",
    settings_verified_badge: "You are verified",
    
    lang_modal_title: "Select Language",
    lang_search_placeholder: "Search Ghanaian language…",
    lang_switched: "Language updated successfully",
    
    market_search_placeholder: "Search products, categories, or Ghanaian sellers…",
    market_all_cats: "All Categories",
    market_fashion: "Fashion & Kente",
    market_beauty: "Beauty & Cosmetics",
    market_electronics: "Electronics & Phones",
    market_food: "Groceries & Food",
    market_crafts: "Handmade & Crafts",
    market_home: "Home & Living",
    market_add_cart: "Add to Cart",
    market_buy_now: "Buy Now",
    market_contact_seller: "Contact Seller",
    market_message_seller: "Message Seller",
    market_reviews: "Reviews",
    market_in_stock: "In Stock",
    market_out_of_stock: "Out of Stock",
    market_seller_verified: "Verified seller",
    market_follow: "Follow",
    market_following: "Following",
    
    orders_empty: "No orders yet",
    checkout_title: "Checkout",
    checkout_delivery_addr: "Delivery Address",
    checkout_region: "Delivery Region",
    checkout_phone: "Phone Number for Mobile Money / Delivery",
    checkout_payment_method: "Payment Method",
    checkout_cod: "Cash on Delivery",
    checkout_momo: "Mobile Money (MTN MoMo, Telecel Cash, AT Money)",
    checkout_place_order: "Place Order",
    checkout_total: "Total",
    checkout_subtotal: "Subtotal",
    checkout_fee: "Delivery Fee",
    
    id_buyer_title: "Buyer Identity Verification (Ghana Card)",
    id_seller_title: "Merchant & Seller Identity Verification",
    id_mandatory_sub: "Mandatory for all marketplace orders under Laws of Ghana & anti-fraud compliance.",
    id_private_heading: "100% Private & Zero-Access Security",
    id_card_number: "Ghana Card PIN (e.g. GHA-123456789-0)",
    id_legal_name: "Full Legal Name as shown on Ghana Card",
    id_front_photo: "Front photo of Ghana Card",
    id_back_photo: "Back photo of Ghana Card",
    id_liveness_selfie: "Take Liveness Selfie",
    id_submit_btn: "Submit for Verification",
    id_status_verified: "Approved & Verified ✓",
    id_status_pending: "Under Security Team Review",
    
    btn_save: "Save",
    btn_cancel: "Cancel",
    btn_close: "Close",
    btn_delete: "Delete",
    btn_edit: "Edit",
    btn_update: "Update",
    btn_submit: "Submit",
    toast_saved: "Saved successfully",
    toast_loading: "Please wait…",
    toast_network_error: "Network error. Please check your connection.",
    toast_offline: "You are currently offline.",
    toast_online: "Internet connection restored.",
    empty_no_items: "No items found"
  },
  
  tw: {
    app_name: "SellerFlow",
    tagline: "Ghana aguadifoɔ ne aditɔfoɔ baabi a wɔhyia.",
    nav_for_you: "Deɛ Ɛfa Wo Ho",
    nav_dashboard: "Aguadifoɔ Bea",
    nav_marketplace: "Eguadibea",
    nav_products: "Nnoɔma",
    nav_orders: "Nnoɔma a Wɔatɔ",
    nav_store: "Me Sitɔɔ",
    nav_analysis: "Nhwehwɛmu",
    nav_profile: "Me Ho Nsɛm",
    nav_settings: "Nsiesiei",
    nav_chats: "Nkɔmbɔ",
    nav_cart: "Kɛntɛn",
    nav_admin: "Panin Bea",
    nav_back: "← San Kɔ Akyi",
    nav_signin_register: "Wura Mu / Hyehyɛ Wo Din",
    nav_signout: "Firi Mu",
    
    title_for_you: "Deɛ Ɛfa Wo Ho",
    title_marketplace: "Eguadibea",
    title_products: "Nnoɔma a Wotɔn",
    title_orders: "Nnoɔma a Wɔatɔ",
    title_store: "Wo Sitɔɔ",
    title_analysis: "Aguadi Nhwehwɛmu",
    title_profile: "Wo Ho Nsɛm",
    title_settings: "Nsiesiei",
    title_chats: "Nkɔmbɔ",
    title_cart: "Wo Kɛntɛn",
    title_notifications: "Nkaebɔ",
    title_dashboard: "Aguadifoɔ Baabi",
    
    sub_for_you: "Hwɛ nnoɔma ho video na hu Ghana aguadifoɔ papa.",
    sub_marketplace: "Hwehwɛ Ghana nnoɔma pa, aduane, ntoma ne nsaanodwuma.",
    sub_products: "Siesie wo nnoɔma, ne boɔ ne deɛ woahyehyɛ.",
    sub_orders: "Hwɛ nnoɔma a woatɔ ne baabi a edu.",
    sub_store: "Siesie wo sitɔɔ mfonini, din ne wo nnoɔma nyinaa.",
    sub_analysis: "Hwɛ sɛdeɛ wo nnoɔma rekɔ so ne sika a wanya.",
    sub_profile: "Siesie wo din, email ne wo mfonini.",
    sub_settings: "Siesie wo kɔnti, kasa, nkaebɔ ne nkrataa ho nsɛm.",
    sub_chats: "Kasa kyerɛ aditɔfoɔ ne aguadifoɔ tee.",
    sub_cart: "Hwɛ nnoɔma a wowɔ wɔ kɛntɛn mu ansa na woatua ka.",
    
    auth_create_account: "Bɔ Wo Kɔnti Foforɔ",
    auth_welcome_back: "Akwaaba Bio",
    auth_sell_and_shop: "Tɔn na tɔ nnoɔma wɔ Ghana afaasa nyinaa.",
    auth_signin_continue: "Wura mu na toaso.",
    auth_fullname: "Wo Din Nyinaa",
    auth_username: "Aguadi Din (Username)",
    auth_email: "Email",
    auth_password: "Password",
    auth_terms_agree: "Mepene SellerFlow Mmara ne Nhyehyɛeɛ nyinaa so.",
    auth_btn_create: "Bɔ Kɔnti",
    auth_btn_signin: "Wura Mu",
    auth_continue_google: "Fa Google Wura Mu",
    auth_forgot_password: "Wo werɛ afi wo password?",
    auth_switch_signin: "Wowɔ kɔnti dedaw? Wura mu ha",
    auth_switch_register: "Woyɛ foforɔ? Bɔ kɔnti foforɔ",
    auth_back_feed: "← San kɔ For You",
    auth_verify_title: "Yɛ Wo Email Ho Nhwehwɛmu",
    auth_verify_sub: "Hwɛ wo email inbox mu na nya nkratoɔ no.",
    auth_verify_sent_to: "Yɛamane nkratoɔ kɔmaa",
    auth_verify_check: "Hwɛ Sɛ Wɔagye Atom",
    auth_verify_resend: "Mane Email No Bio",
    auth_verify_change_email: "Sesa email / Fa kɔnti foforɔ wura mu",
    
    settings_account_notif: "Kɔnti ne Nkaebɔ",
    settings_language: "Kasa (Language)",
    settings_language_desc: "Pau Ghana kasa a wopɛ sɛ wode di dwuma.",
    settings_change_language: "Sesa Kasa",
    settings_notifications: "Fon Nkaebɔ (Notifications)",
    settings_tutorial: "Sua Sɛdeɛ Wɔde Di Dwuma",
    settings_terms: "Mmara ne Nhyehyɛeɛ",
    settings_identity_verif: "Aguadifoɔ Ho Adanseɛ Nhwehwɛmu",
    settings_start_verif: "Firi Ghana Card Nhwehwɛmu Ase",
    settings_verified_badge: "Wɔagye wo atom pɛpɛɛpɛ ✓",
    
    lang_modal_title: "Pau Kasa",
    lang_search_placeholder: "Hwehwɛ Ghana kasa…",
    lang_switched: "Woasesa kasa no yie",
    
    market_search_placeholder: "Hwehwɛ nnoɔma, nkyekyɛmu, anaa aguadifoɔ…",
    market_all_cats: "Nkyekyɛmu Nyinaa",
    market_fashion: "Ntoma ne Ntadeɛ",
    market_beauty: "Ahoɔfɛ ne Ahosiesie",
    market_electronics: "Fon ne Anyinam Nnoɔma",
    market_food: "Aduane ne Nnuane",
    market_crafts: "Nsaanodwuma ne Adwinneɛ",
    market_home: "Fie Nnoɔma",
    market_add_cart: "Fa Hyɛ Kɛntɛn Mu",
    market_buy_now: "Tɔ Seesei Ara",
    market_contact_seller: "Frɛ Aguadifoɔ No",
    market_message_seller: "Mane Aguadifoɔ No Nkratoɔ",
    market_reviews: "Deɛ Nnipa Ka",
    market_in_stock: "Ɛwɔ Hɔ",
    market_out_of_stock: "Asa",
    market_seller_verified: "Aguadifoɔ Pa a Wɔagye Atom",
    market_follow: "Di N'akyi",
    market_following: "Wodi N'akyi",
    
    orders_empty: "Wontɔɔ hwee da",
    checkout_title: "Tua Ka",
    checkout_delivery_addr: "Baabi a Wɔmfa Mmrɛ Wo",
    checkout_region: "Mantam (Region)",
    checkout_phone: "Fon Nɔma a Wode Bɛtua MoMo",
    checkout_payment_method: "Sɛdeɛ Wobɛtua Ka",
    checkout_cod: "Tua Ka Sɛ Nnoɔma No Ba A",
    checkout_momo: "Mobile Money (MTN MoMo, Telecel, AT)",
    checkout_place_order: "Hyɛ Nnoɔma No Ho Nkɔm",
    checkout_total: "Ne Nyinaa Boɔ",
    checkout_subtotal: "Nnoɔma No Boɔ",
    checkout_fee: "Deɛ Wɔde Bɛbrɛ Wo Ka",
    
    id_buyer_title: "Aditɔfoɔ Ghana Card Nhwehwɛmu",
    id_seller_title: "Aguadifoɔ Ghana Card Nhwehwɛmu",
    id_mandatory_sub: "Ɛyɛ mmara wɔ Ghana sɛ obiara de ne Ghana Card bɛdi dwuma bammbɔ nti.",
    id_private_heading: "Bammbɔ Pa a Obiaa Nhu",
    id_card_number: "Ghana Card PIN (Mfatoho: GHA-123456789-0)",
    id_legal_name: "Wo Din Ankasa wɔ Ghana Card No So",
    id_front_photo: "Ghana Card No Anim Mfonini",
    id_back_photo: "Ghana Card No Akyi Mfonini",
    id_liveness_selfie: "Twa Wo Anim Mfonini",
    id_submit_btn: "Mane Ma Wɔnhwehwɛ Mu",
    id_status_verified: "Wɔagye Atom ✓",
    id_status_pending: "Bammbɔ Kuo Rehwehwɛ Mu",
    
    btn_save: "Fa Sie",
    btn_cancel: "Gyae",
    btn_close: "To Mu",
    btn_delete: "Pepa",
    btn_edit: "Sesa",
    btn_update: "Siesie Bio",
    btn_submit: "Mane",
    toast_saved: "Woade sie yie",
    toast_loading: "Twɛn kakra…",
    toast_network_error: "Intanɛt no yɛ basaa. San bɔ mmɔden bio.",
    toast_offline: "Intanɛt nni hɔ seesei.",
    toast_online: "Intanɛt aba bio.",
    empty_no_items: "Hwee nni ha"
  },
  
  gpe: {
    app_name: "SellerFlow",
    tagline: "Ghana number one social marketplace.",
    nav_for_you: "For You",
    nav_dashboard: "Seller Board",
    nav_marketplace: "Market",
    nav_products: "Products",
    nav_orders: "Orders",
    nav_store: "My Store",
    nav_analysis: "Analytics",
    nav_profile: "My Profile",
    nav_settings: "Settings",
    nav_chats: "Messages",
    nav_cart: "Cart",
    nav_admin: "Admin",
    nav_back: "← Go Back",
    nav_signin_register: "Sign In / Register",
    nav_signout: "Log Out",
    
    title_for_you: "For You",
    title_marketplace: "Ghana Market",
    title_products: "Your Products",
    title_orders: "Your Orders",
    title_store: "Your Store",
    title_analysis: "Performance",
    title_profile: "User Profile",
    title_settings: "Settings",
    title_chats: "Chat Room",
    title_cart: "Your Cart",
    title_notifications: "Alerts",
    title_dashboard: "Seller Center",
    
    sub_for_you: "Watch sharp product videos and connect with legit Ghanaian sellers.",
    sub_marketplace: "Check proper Ghanaian fashion, food, gadgets and fine crafts.",
    sub_products: "Manage your goods, update prices and check stock level.",
    sub_orders: "Track your orders and see where your parcel reach.",
    sub_store: "Design your shop with fine banner, logo and product catalogue.",
    sub_analysis: "Check how your sales dey go and see customer visits.",
    sub_profile: "Update your full name, username and dp.",
    sub_settings: "Set your account, language, alerts and identity pass.",
    sub_chats: "Chook mouth with buyers and verified Ghanaian vendors sharp.",
    sub_cart: "Check all your selected items before you pay.",
    
    auth_create_account: "Create New Account",
    auth_welcome_back: "Welcome Back",
    auth_sell_and_shop: "Sell and buy items all across Ghana.",
    auth_signin_continue: "Log in make you continue.",
    auth_fullname: "Your Full Name",
    auth_username: "Shop Name / Username",
    auth_email: "Email Address",
    auth_password: "Password",
    auth_terms_agree: "I agree to SellerFlow Rules and I promise to use am legally.",
    auth_btn_create: "Create Account",
    auth_btn_signin: "Log In Now",
    auth_continue_google: "Use Google Log In",
    auth_forgot_password: "You forget password?",
    auth_switch_signin: "You get account already? Log in here",
    auth_switch_register: "You be new? Register account fast",
    auth_back_feed: "← Go back to For You",
    auth_verify_title: "Verify Your Email",
    auth_verify_sub: "Check your email inbox make you click the link.",
    auth_verify_sent_to: "We don send verification message give",
    auth_verify_check: "Check Verification",
    auth_verify_resend: "Send Email Again",
    auth_verify_change_email: "Change email / Log in with another account",
    
    settings_account_notif: "Account & Alerts",
    settings_language: "Language",
    settings_language_desc: "Pick the Ghanaian language you want use.",
    settings_change_language: "Change Language",
    settings_notifications: "Phone Notifications",
    settings_tutorial: "App Guide & Tutorial",
    settings_terms: "Terms & Conditions",
    settings_identity_verif: "Seller Verification Badge",
    settings_start_verif: "Start Ghana Card Verification",
    settings_verified_badge: "You be Verified Seller ✓",
    
    lang_modal_title: "Pick Your Language",
    lang_search_placeholder: "Search language…",
    lang_switched: "Language don change successfully",
    
    market_search_placeholder: "Search items, category or Ghanaian sellers…",
    market_all_cats: "All Categories",
    market_fashion: "Fashion & Kente",
    market_beauty: "Beauty & Cosmetics",
    market_electronics: "Phones & Electronics",
    market_food: "Food & Groceries",
    market_crafts: "Handmade & Art",
    market_home: "Home Items",
    market_add_cart: "Put inside Cart",
    market_buy_now: "Buy Am Now",
    market_contact_seller: "Call Seller",
    market_message_seller: "Send Message",
    market_reviews: "Customer Reviews",
    market_in_stock: "Item Dey Stock",
    market_out_of_stock: "Item Don Finish",
    market_seller_verified: "Legit Verified Seller",
    market_follow: "Follow Seller",
    market_following: "You Dey Follow",
    
    orders_empty: "You never buy anything yet",
    checkout_title: "Checkout & Pay",
    checkout_delivery_addr: "Where make we bring am?",
    checkout_region: "Region",
    checkout_phone: "MoMo / Delivery Phone Number",
    checkout_payment_method: "Payment Method",
    checkout_cod: "Pay when parcel land (Cash on Delivery)",
    checkout_momo: "Mobile Money (MTN MoMo, Telecel, AT)",
    checkout_place_order: "Confirm Order Now",
    checkout_total: "Total Price",
    checkout_subtotal: "Goods Price",
    checkout_fee: "Delivery Fee",
    
    id_buyer_title: "Buyer Ghana Card Check",
    id_seller_title: "Seller Ghana Card & Business Check",
    id_mandatory_sub: "Ghana law require ID verification to stop fraud completely.",
    id_private_heading: "Private & Encrypted Security",
    id_card_number: "Ghana Card PIN (e.g. GHA-123456789-0)",
    id_legal_name: "Full Name on top Ghana Card",
    id_front_photo: "Ghana Card Front Picture",
    id_back_photo: "Ghana Card Back Picture",
    id_liveness_selfie: "Snap Live Selfie",
    id_submit_btn: "Submit for Verification",
    id_status_verified: "Verified & Approved ✓",
    id_status_pending: "Security Team Dey Check Am",
    
    btn_save: "Save Am",
    btn_cancel: "Cancel",
    btn_close: "Close",
    btn_delete: "Delete",
    btn_edit: "Edit",
    btn_update: "Update",
    btn_submit: "Submit",
    toast_saved: "E don save well",
    toast_loading: "Small time, e dey load…",
    toast_network_error: "Network dey shake. Try am again.",
    toast_offline: "No internet right now.",
    toast_online: "Internet don connect back.",
    empty_no_items: "Nothing dey here"
  },

  fat: {
    app_name: "SellerFlow",
    tagline: "Ghana eguadzifo na adzetɔfo bea.",
    nav_for_you: "Dza Ɔfa Wo Ho",
    nav_dashboard: "Eguadzifo Bea",
    nav_marketplace: "Eguadzibea",
    nav_products: "Ndzɛmba",
    nav_orders: "Ndzɛmba a Wɔatɔ",
    nav_store: "Me Sitɔɔ",
    nav_analysis: "Nhwehwɛmu",
    nav_profile: "Me Ho Nsɛm",
    nav_settings: "Nsesae",
    nav_chats: "Nkɔmbɔ",
    nav_cart: "Kɛntɛn",
    nav_admin: "Panyin Bea",
    nav_back: "← San Kɔ Ekyir",
    nav_signin_register: "Wura Mu / Hyehyɛ Wo Dzin",
    nav_signout: "Pue",
    
    title_for_you: "Dza Ɔfa Wo Ho",
    title_marketplace: "Eguadzibea",
    title_products: "Ndzɛmba a Etɔn",
    title_orders: "Ndzɛmba a Wɔatɔ",
    title_store: "Wo Sitɔɔ",
    title_analysis: "Eguadzi Nhwehwɛmu",
    title_profile: "Wo Ho Nsɛm",
    title_settings: "Nsesae",
    title_chats: "Nkɔmbɔ",
    title_cart: "Wo Kɛntɛn",
    title_notifications: "Nkaabɔ",
    title_dashboard: "Eguadzifo Beae",
    
    sub_for_you: "Hwɛ ndzɛmba ho video na hu Ghana eguadzifo pa.",
    sub_marketplace: "Hwehwɛ Ghana ndzɛmba pa, edziban, ntoma na nsaanodwuma.",
    sub_products: "Siesie wo ndzɛmba, ne bo na dza eguadzibea hɔ.",
    sub_orders: "Hwɛ ndzɛmba a eatɔ na beae a edu.",
    sub_store: "Siesie wo sitɔɔ mfonyin, dzin na wo ndzɛmba nyinara.",
    sub_analysis: "Hwɛ mbrɛ wo ndzɛmba rekɔ do na sika a enya.",
    sub_profile: "Siesie wo dzin, email na wo mfonyin.",
    sub_settings: "Siesie wo akawnt, kasa, nkaabɔ na nkrataa ho nsɛm.",
    sub_chats: "Kasa kyerɛ adzetɔfo na eguadzifo tsee.",
    sub_cart: "Hwɛ ndzɛmba a ewɔ kɛntɛn mu ansaana eatua kaw.",
    
    auth_create_account: "Bɔ Akawnt Fofor",
    auth_welcome_back: "Akwaaba Bio",
    auth_sell_and_shop: "Tɔn na tɔ ndzɛmba wɔ Ghana nyinara.",
    auth_signin_continue: "Wura mu na toado.",
    auth_fullname: "Wo Dzin Nyinara",
    auth_username: "Eguadzi Dzin (Username)",
    auth_email: "Email",
    auth_password: "Password",
    auth_terms_agree: "Mepene SellerFlow Mbra na Nhyehyɛe do.",
    auth_btn_create: "Bɔ Akawnt",
    auth_btn_signin: "Wura Mu",
    auth_continue_google: "Fa Google Wura Mu",
    auth_forgot_password: "W'awerɛ efi wo password?",
    auth_switch_signin: "Ewɔ akawnt dedaw? Wura mu ha",
    auth_switch_register: "Eyɛ fofor? Bɔ akawnt fofor",
    auth_back_feed: "← San kɔ For You",
    auth_verify_title: "Yɛ Wo Email Ho Nhwehwɛmu",
    auth_verify_sub: "Hwɛ wo email inbox mu na nya nkrato no.",
    auth_verify_sent_to: "Yɛamane nkrato kɔmaa",
    auth_verify_check: "Hwɛ Sɛ Wɔagye Atom",
    auth_verify_resend: "Mane Email No Bio",
    auth_verify_change_email: "Sesa email / Fa akawnt fofor wura mu",
    
    settings_account_notif: "Akawnt na Nkaabɔ",
    settings_language: "Kasa (Language)",
    settings_language_desc: "Paw Ghana kasa a epɛ dɛ edze dzi dwuma.",
    settings_change_language: "Sesa Kasa",
    settings_notifications: "Fon Nkaabɔ",
    settings_tutorial: "Sua Mbrɛ Wɔdze Dzi Dwuma",
    settings_terms: "Mbra na Nhyehyɛe",
    settings_identity_verif: "Eguadzifo Ho Adanse Nhwehwɛmu",
    settings_start_verif: "Hyɛ Ghana Card Nhwehwɛmu Ase",
    settings_verified_badge: "Wɔagye wo atom pɛpɛɛpɛ ✓",
    
    lang_modal_title: "Paw Kasa",
    lang_search_placeholder: "Hwehwɛ Ghana kasa…",
    lang_switched: "Easesa kasa no yie",
    
    market_search_placeholder: "Hwehwɛ ndzɛmba, nkyekyɛmu, anaa eguadzifo…",
    market_all_cats: "Nkyekyɛmu Nyinara",
    market_fashion: "Ntoma na Ntado",
    market_beauty: "Ahoɔfɛw na Ahosiesie",
    market_electronics: "Fon na Anyinam Ndzɛmba",
    market_food: "Edziban na Ndzɛmba a Wodzidzi",
    market_crafts: "Nsaanodwuma na Adwinne",
    market_home: "Fie Ndzɛmba",
    market_add_cart: "Fa Hyɛ Kɛntɛn Mu",
    market_buy_now: "Tɔ Seseiara",
    market_contact_seller: "Frɛ Eguadzinyi No",
    market_message_seller: "Mane Eguadzinyi No Nkrato",
    market_reviews: "Dza Nkorɔfo Kã",
    market_in_stock: "Ɔwɔ Hɔ",
    market_out_of_stock: "Esa",
    market_seller_verified: "Eguadzinyi a Wɔagye No Atom",
    market_follow: "Dzi N'ekyir",
    market_following: "Edzi N'ekyir",
    
    orders_empty: "Entɔɔ hwee da",
    checkout_title: "Tua Kaw",
    checkout_delivery_addr: "Beae a Wɔmfa Mbrɛ Wo",
    checkout_region: "Mantom",
    checkout_phone: "Fon Nɔmba a Wɔdze Bɛtua MoMo",
    checkout_payment_method: "Mbrɛ Ebɛtua Kaw",
    checkout_cod: "Tua Kaw Sɛ Ndzɛmba No Ba A",
    checkout_momo: "Mobile Money (MTN, Telecel, AT)",
    checkout_place_order: "Hyɛ Ndzɛmba No Ho Nkɔm",
    checkout_total: "Ne Nyinara Bo",
    checkout_subtotal: "Ndzɛmba No Bo",
    checkout_fee: "Dza Wɔdze Bɛbrɛ Wo Kaw",
    
    id_buyer_title: "Adzetɔfo Ghana Card Nhwehwɛmu",
    id_seller_title: "Eguadzifo Ghana Card Nhwehwɛmu",
    id_mandatory_sub: "Ɔyɛ mbra wɔ Ghana dɛ obiara dze ne Ghana Card bɛdzi dwuma banbɔ ntsi.",
    id_private_heading: "Banbɔ Pa a Obiara Nnhu",
    id_card_number: "Ghana Card PIN",
    id_legal_name: "Wo Dzin Ankasa wɔ Ghana Card No Do",
    id_front_photo: "Ghana Card No Enyim Mfonyin",
    id_back_photo: "Ghana Card No Ekyir Mfonyin",
    id_liveness_selfie: "Twa Wo Enyim Mfonyin",
    id_submit_btn: "Mane Ma Wɔnhwehwɛ Mu",
    id_status_verified: "Wɔagye Atom ✓",
    id_status_pending: "Banbɔ Ekuw Rehwehwɛ Mu",
    
    btn_save: "Fa Sie",
    btn_cancel: "Gyae",
    btn_close: "To Mu",
    btn_delete: "Pepa",
    btn_edit: "Sesa",
    btn_update: "Siesie Bio",
    btn_submit: "Mane",
    toast_saved: "Wɔadze esie yie",
    toast_loading: "Twɛn kakra…",
    toast_network_error: "Intanɛt no yɛ basaa. San bɔ mbɔdzen bio.",
    toast_offline: "Intanɛt nnyi hɔ seseiara.",
    toast_online: "Intanɛt aba bio.",
    empty_no_items: "Hwee nnyi ha"
  },

  gaa: {
    app_name: "SellerFlow",
    tagline: "Ghana jarayelɔi kɛ wolɔi agbɛjianɔtoo.",
    nav_for_you: "Oha Bo",
    nav_dashboard: "Jarayelɔ Weku",
    nav_marketplace: "Jara nɔ",
    nav_products: "Nibii",
    nav_orders: "Nibii ni ahé",
    nav_store: "Mi-Sitɔɔ",
    nav_analysis: "Kaa nɔ",
    nav_profile: "Mi he sane",
    nav_settings: "Gbɛjianɔtoo",
    nav_chats: "Sanegbaa",
    nav_cart: "Kɛntɛn",
    nav_admin: "Nukpa he",
    nav_back: "← Ku ohe sɛɛ",
    nav_signin_register: "Bote mli / Ŋma ogbɛi",
    nav_signout: "Je mli",
    
    title_for_you: "Oha Bo",
    title_marketplace: "Jara nɔ",
    title_products: "Onibii",
    title_orders: "Nibii ni ahé",
    title_store: "O-Sitɔɔ",
    title_analysis: "Jarayeli kaa nɔ",
    title_profile: "Ohe Sane",
    title_settings: "Gbɛjianɔtoo",
    title_chats: "Sanegbaa",
    title_cart: "Okɛntɛn",
    title_notifications: "Shiemɔ",
    title_dashboard: "Jarayelɔ he",
    
    sub_for_you: "Kwɛmɔ videoi kɛ kase Ghana jarayelɔi kpakpai.",
    sub_marketplace: "Taomɔ Ghana nibii kpakpai, niyenii kɛ atadeni.",
    sub_products: "To onibii, amɛjara kɛ amɛfa gbɛjianɔ.",
    sub_orders: "Kwɛmɔ onibii ni ohé kɛ he ni amɛyashɛ.",
    sub_store: "Saamɔ o-sitɔɔ mfoniri, ogbɛi kɛ onibii fɛɛ.",
    sub_analysis: "Kwɛmɔ bɔ ni ojarayeli yaa nɔ ehaa.",
    sub_profile: "Saamɔ ogbɛi, email kɛ omfoniri.",
    sub_settings: "Saamɔ oakawnt, wiemɔ, shiemɔ kɛ woji ahe sane.",
    sub_chats: "Kɛ wolɔi kɛ jarayelɔi agba sane tɛ̃ɛ.",
    sub_cart: "Kwɛmɔ nibii ni yɔɔ okɛntɛn mli dani owo nyɔmɔ.",
    
    auth_create_account: "Fee Akawnt Hee",
    auth_welcome_back: "Here O-Atuu Ekonn",
    auth_sell_and_shop: "Hɔɔmɔ ni ohé nibii yɛ Ghana fɛɛ.",
    auth_signin_continue: "Bote mli koni oya nɔ.",
    auth_fullname: "Ogbɛi Mli fɛɛ",
    auth_username: "Jarayeli Gbɛi (Username)",
    auth_email: "Email",
    auth_password: "Password",
    auth_terms_agree: "Miyiŋ kpã SellerFlow mla kɛ gbɛjianɔtoo fɛɛ nɔ.",
    auth_btn_create: "Fee Akawnt",
    auth_btn_signin: "Bote Mli",
    auth_continue_google: "Kɛ Google Bote Mli",
    auth_forgot_password: "Ohie kpa opassword nɔ?",
    auth_switch_signin: "Oyɛ akawnt momo? Bote mli biɛ",
    auth_switch_register: "Gbɔ ji bo? Fee akawnt hee",
    auth_back_feed: "← Ku ohe kɛya For You",
    auth_verify_title: "Kaa O-Email Mli",
    auth_verify_sub: "Kwɛmɔ o-email inbox mli koni ona sɔŋ.",
    auth_verify_sent_to: "Wɔtshu sɔŋ kɛya ha",
    auth_verify_check: "Kwɛmɔ Kɛji Akpɛlɛ Nɔ",
    auth_verify_resend: "Tshu Email Lɛ Ekonn",
    auth_verify_change_email: "Tsakemɔ email / Kɛ akawnt kroko bote mli",
    
    settings_account_notif: "Akawnt kɛ Shiemɔ",
    settings_language: "Wiemɔ (Language)",
    settings_language_desc: "Halamɔ Ghana wiemɔ ni osumɔɔ.",
    settings_change_language: "Tsakemɔ Wiemɔ",
    settings_notifications: "Fon nɔ Shiemɔ",
    settings_tutorial: "Kase Bɔ Ni Akɛtsuɔ Nii",
    settings_terms: "Mla kɛ Gbɛjianɔtoo",
    settings_identity_verif: "Jarayelɔ Odase Kaa",
    settings_start_verif: "Je Ghana Card Kaa Shishi",
    settings_verified_badge: "Akpɛlɛ onɔ kpakpa ✓",
    
    lang_modal_title: "Halamɔ Wiemɔ",
    lang_search_placeholder: "Taomɔ Ghana wiemɔ…",
    lang_switched: "Otsake wiemɔ lɛ jogbaŋŋ",
    
    market_search_placeholder: "Taomɔ nibii, kusum, aloo jarayelɔi…",
    market_all_cats: "Kusum Fɛɛ",
    market_fashion: "Ntoma kɛ Atadei",
    market_beauty: "Fɛo kɛ Hekpamɔ",
    market_electronics: "Fon kɛ Laitrik Nibii",
    market_food: "Niyenii kɛ Nibaanii",
    market_crafts: "Nijiranii kɛ Adwengbɛ",
    market_home: "Shĩa Nibii",
    market_add_cart: "Wo Kɛntɛn Mli",
    market_buy_now: "Hémɔ Amrɔ Nɛɛ",
    market_contact_seller: "Tsɛmɔ Jarayelɔ Lɛ",
    market_message_seller: "Tshumɔ Sane",
    market_reviews: "Nɔ ni mɛi kɛɔ",
    market_in_stock: "Eyɛ shishi",
    market_out_of_stock: "Egbe naa",
    market_seller_verified: "Jarayelɔ ni akpɛlɛ enɔ",
    market_follow: "Nyiɛ esɛɛ",
    market_following: "Onyiɛ esɛɛ",
    
    orders_empty: "Ohéko noko lolo",
    checkout_title: "Womɔ Nyɔmɔ",
    checkout_delivery_addr: "He ni Akɛbaahao",
    checkout_region: "Kpokpaa (Region)",
    checkout_phone: "Fon Nɔmba ni Akɛbaawo MoMo",
    checkout_payment_method: "Bɔ ni Obaawo Nyɔmɔ",
    checkout_cod: "Womɔ kɛji nibii lɛ bashɛ",
    checkout_momo: "Mobile Money (MTN, Telecel, AT)",
    checkout_place_order: "To Nibii Lɛ Gbɛjianɔ",
    checkout_total: "Nyɔmɔ fɛɛ",
    checkout_subtotal: "Nibii Anyɔmɔ",
    checkout_fee: "Kɛbamɔ Nyɔmɔ",
    
    id_buyer_title: "Wolɔ Ghana Card Kaa",
    id_seller_title: "Jarayelɔ Ghana Card Kaa",
    id_mandatory_sub: "Ghana mla kɛɛ esa akɛ akɛ Ghana Card atsu nii kɛha hebuu.",
    id_private_heading: "Hebuu Kpakpa ni Mɔko Nuko",
    id_card_number: "Ghana Card PIN",
    id_legal_name: "Ogbɛi Kpɔŋŋ yɛ Ghana Card nɔ",
    id_front_photo: "Ghana Card Hiɛ Mfoniri",
    id_back_photo: "Ghana Card Sɛɛ Mfoniri",
    id_liveness_selfie: "Gbeemɔ Ohiɛ Mfoniri",
    id_submit_btn: "Tshumɔ Kɛha Kaa",
    id_status_verified: "Akpɛlɛ nɔ ✓",
    id_status_pending: "Hebuu Kuumu miikaa mli",
    
    btn_save: "Tomɔ",
    btn_cancel: "Tsimɔ",
    btn_close: "Nga",
    btn_delete: "Kpamɔ",
    btn_edit: "Saamɔ",
    btn_update: "Saamɔ Ekonn",
    btn_submit: "Tshumɔ",
    toast_saved: "Eto jogbaŋŋ",
    toast_loading: "Mɛmɔ fioo…",
    toast_network_error: "Intanɛt lɛ bɛ. Ka ekonn.",
    toast_offline: "Intanɛt bɛ amrɔ nɛɛ.",
    toast_online: "Intanɛt eba ekonn.",
    empty_no_items: "Noko bɛ biɛ"
  },

  ee: {
    app_name: "SellerFlow",
    tagline: "Ghana asitsalawo kple nudzralawo ƒe asigã.",
    nav_for_you: "Tɔwò",
    nav_dashboard: "Asitsala Ƒe Aƒe",
    nav_marketplace: "Asime",
    nav_products: "Nudzrowo",
    nav_orders: "Nudzraɖoɖowo",
    nav_store: "Nye Asitɔ",
    nav_analysis: "Nukpɔkpɔ",
    nav_profile: "Nye Ŋkɔ",
    nav_settings: "Ðoɖowo",
    nav_chats: "Dzeɖoɖo",
    nav_cart: "Kotoku",
    nav_admin: "Dzikpɔla",
    nav_back: "← Trɔ Yi Megbe",
    nav_signin_register: "Ge Ðe Eme / Ŋlɔ Ŋkɔ",
    nav_signout: "Do Le Eme",
    
    title_for_you: "Tɔwò",
    title_marketplace: "Ghana Asime",
    title_products: "Wò Nudzrowo",
    title_orders: "Nudzraɖoɖowo",
    title_store: "Wò Asitɔ",
    title_analysis: "Asitsatsa Ƒe Nukpɔkpɔ",
    title_profile: "Wò Ŋkɔ",
    title_settings: "Ðoɖowo",
    title_chats: "Dzeɖoɖo",
    title_cart: "Wò Kotoku",
    title_notifications: "Gbeƒãɖeɖe",
    title_dashboard: "Asitsala Ƒe Dɔwɔƒe",
    
    sub_for_you: "Kpɔ video siwo ku ɖe nuwɔwɔwo ŋu eye nàdze si Ghana asitsala bibiwo.",
    sub_marketplace: "Di Ghana nu nyuiwo, nuduɖu, awu kple aɖanuwɔwɔwo.",
    sub_products: "Kpɔ wò nudzrowo, woƒe asixɔxɔ kple woƒe agbɔsɔsɔ dzi.",
    sub_orders: "Di wò nudzraɖoɖowo kple afisi wò nuwo ɖo.",
    sub_store: "Trɔ asi le wò asitɔ ƒe nɔnɔmetata kple nuwo ŋu.",
    sub_analysis: "Kpɔ ale si wò asitsatsa le zɔyim kple ga si nèkpɔ.",
    sub_profile: "Trɔ asi le wò ŋkɔ, email kple wò foto ŋu.",
    sub_settings: "Kpɔ wò akawnt, gbegbɔgblɔ, gbeƒãɖeɖe kple dzesidede dzi.",
    sub_chats: "Ɖo dze kple nuflelawo kpakple asitsalawo tẽ.",
    sub_cart: "Dzro wò nuwo me le kotoku me hafi nàxe fe.",
    
    auth_create_account: "Wɔ Akawnt Yeye",
    auth_welcome_back: "Woezɔ Gale Eme",
    auth_sell_and_shop: "Dzra nu hefle nu le Ghana katã.",
    auth_signin_continue: "Ge ɖe eme ne nàgatee.",
    auth_fullname: "Wò Ŋkɔ Blibo",
    auth_username: "Asitsala Ŋkɔ (Username)",
    auth_email: "Email",
    auth_password: "Password",
    auth_terms_agree: "Melɔ̃ ɖe SellerFlow ƒe Se kple Ðoɖowo dzi.",
    auth_btn_create: "Wɔ Akawnt",
    auth_btn_signin: "Ge Ðe Eme",
    auth_continue_google: "Zã Google Ge Ðe Eme",
    auth_forgot_password: "Wò ŋku le password dzi?",
    auth_switch_signin: "Akawnt le asiwò xoxo? Ge ɖe eme le afisia",
    auth_switch_register: "Ènye yeye? Wɔ akawnt yeye",
    auth_back_feed: "← Trɔ yi For You",
    auth_verify_title: "Kpɔ Wò Email Dzi",
    auth_verify_sub: "Kpɔ wò email me ne nàzi kadodoa dzi.",
    auth_verify_sent_to: "Míedɔ gbedeasi ɖo ɖe",
    auth_verify_check: "Kpɔe Ða Ne Enye Nyateƒe",
    auth_verify_resend: "Gadze Email Ɖa",
    auth_verify_change_email: "Trɔ email / Zã akawnt bubu ge ɖe eme",
    
    settings_account_notif: "Akawnt kple Gbeƒãɖeɖe",
    settings_language: "Gbegbɔgblɔ (Language)",
    settings_language_desc: "Tia Ghana gbe si nèdi be yeazã.",
    settings_change_language: "Trɔ Gbegbɔgblɔ",
    settings_notifications: "Kaƒomɔ Dzi Gbeƒãɖeɖe",
    settings_tutorial: "Srɔ̃ Ale Si Woazãe",
    settings_terms: "Se kple Ðoɖowo",
    settings_identity_verif: "Asitsala Ƒe Dzesidede",
    settings_start_verif: "Dze Ghana Card Dzesidede Gɔme",
    settings_verified_badge: "Woxɔ wò le se nu ✓",
    
    lang_modal_title: "Tia Gbegbɔgblɔ",
    lang_search_placeholder: "Di Ghana gbe aɖe…",
    lang_switched: "Gbegbɔgblɔ la trɔ nyuie",
    
    market_search_placeholder: "Di nudzrowo, hatsotsowo, alo asitsalawo…",
    market_all_cats: "Hatsotso Katã",
    market_fashion: "Awu kple Kente",
    market_beauty: "Atsyɔ̃ɖoɖo",
    market_electronics: "Kaƒomɔwo kple Elektrik Nuwo",
    market_food: "Nuduɖu kple Nuɖuɖuwo",
    market_crafts: "Aɖanuwɔwɔwo",
    market_home: "Aƒeme Nuwo",
    market_add_cart: "De Kotoku Me",
    market_buy_now: "Flee Fifia",
    market_contact_seller: "Yɔ Asitsala La",
    market_message_seller: "Ɖo Gbedeasi Ɖa",
    market_reviews: "Nusi Ame Bubuwo Gblɔ",
    market_in_stock: "Ele Anyi",
    market_out_of_stock: "Evɔ",
    market_seller_verified: "Asitsala Vavã",
    market_follow: "Kplɔe Ðo",
    market_following: "Èkplɔe Ðo",
    
    orders_empty: "Mèfle naneke haɖe o",
    checkout_title: "Xe Fe",
    checkout_delivery_addr: "Afisi Woatsɔe Aɖo",
    checkout_region: "Nutome (Region)",
    checkout_phone: "Kaƒomɔ Xɔxɔle MoMo Ŋu",
    checkout_payment_method: "Fe Xexe Ƒe Mɔnu",
    checkout_cod: "Xe fe ne nuwo va ɖo (Cash on Delivery)",
    checkout_momo: "Mobile Money (MTN, Telecel, AT)",
    checkout_place_order: "Ɖo Nuwo Ƒe Gbe",
    checkout_total: "Fe Katã",
    checkout_subtotal: "Nuwo Ƒe Fe",
    checkout_fee: "Tsɔtsɔva Ƒe Fe",
    
    id_buyer_title: "Nuflela Ƒe Ghana Card Kpɔkpɔ",
    id_seller_title: "Asitsala Ƒe Ghana Card Kpɔkpɔ",
    id_mandatory_sub: "Ghana se bia be woazã Ghana Card hena dedienɔnɔ.",
    id_private_heading: "Dedienɔnɔ Gã Si Ame Aɖeke Menyana O",
    id_card_number: "Ghana Card PIN",
    id_legal_name: "Wò Ŋkɔ Teƒeteƒe le Ghana Card dzi",
    id_front_photo: "Ghana Card Ƒe Ŋgɔ Foto",
    id_back_photo: "Ghana Card Ƒe Megbe Foto",
    id_liveness_selfie: "Ɖe Wò Ŋkume Foto",
    id_submit_btn: "Ɖoe Ɖa Hena Dodokpɔ",
    id_status_verified: "Woxɔe le se nu ✓",
    id_status_pending: "Dedienɔnɔ Ha la le edzrom",
    
    btn_save: "Dzrae Ðo",
    btn_cancel: "Tee Ða",
    btn_close: "Tui",
    btn_delete: "Tutui",
    btn_edit: "Trɔ Asi Lee",
    btn_update: "Wɔe Yeye",
    btn_submit: "Ɖoe Ɖa",
    toast_saved: "Edzra ɖo nyuie",
    toast_loading: "Lala vie…",
    toast_network_error: "Intanɛt la mesɔ o. Gatee kpɔ.",
    toast_offline: "Intanɛt mele anyi fifia o.",
    toast_online: "Intanɛt gatee va.",
    empty_no_items: "Naneke mele afisia o"
  },

  dag: {
    app_name: "SellerFlow",
    tagline: "Ghana daabihi mini daamanima laɣingu shee.",
    nav_for_you: "A Dini",
    nav_dashboard: "Kohira Zaashee",
    nav_marketplace: "Daa",
    nav_products: "Nɛma",
    nav_orders: "Daabu Nɛma",
    nav_store: "N Sitɔɔ",
    nav_analysis: "Vihiro",
    nav_profile: "N Yɛla",
    nav_settings: "Zalisi",
    nav_chats: "Yɛtoɣa",
    nav_cart: "Adaka",
    nav_admin: "Kpambaliba",
    nav_back: "← Labi Nyaanga",
    nav_signin_register: "Kpɛm / Kpɛhi A Yuli",
    nav_signout: "Yim",
    
    title_for_you: "A Dini",
    title_marketplace: "Ghana Daa",
    title_products: "A Nɛma",
    title_orders: "Daabu Nɛma",
    title_store: "A Sitɔɔ",
    title_analysis: "Daabilim Vihiro",
    title_profile: "A Yuli mini A Yɛla",
    title_settings: "Zalisi",
    title_chats: "Yɛtoɣa",
    title_cart: "A Daka",
    title_notifications: "Molini",
    title_dashboard: "Kohira Zaashee",
    
    sub_for_you: "Lihimi vidiyonima n-baŋ Ghana kohiriba maŋmaŋa.",
    sub_marketplace: "Bohmimi Ghana nɛma suma, bindirigu, nɛnchari mini nucheeni tuma.",
    sub_products: "Gbaami a nɛma, daa nyoori mini a kohigu soya.",
    sub_orders: "Lihimi a nɛma shɛŋa a ni da mini luɣishɛli di ni paai.",
    sub_store: "Mɛmi a sitɔɔ anfooni, yuli mini nɛma zaa.",
    sub_analysis: "Lihimi a daabilim chandi mini laɣiri shɛli a ni nyɛ.",
    sub_profile: "Taɣimi a yuli, email mini a anfooni.",
    sub_settings: "Taɣimi a akawnt, balli, molini mini shɛhira gbana.",
    sub_chats: "Tɔɣisimi yɛtoɣa ni dahiba mini kohiriba kpeeni.",
    sub_cart: "Lihimi a nɛma shɛŋa ŋan be adaka maa puuni poi ka a naayo.",
    
    auth_create_account: "Kpɛhimi Akawnt Palli",
    auth_welcome_back: "Ti Pahi A Yaha",
    auth_sell_and_shop: "Kohimi ka dami nɛma Ghana zaa.",
    auth_signin_continue: "Kpɛm ka tuɣi.",
    auth_fullname: "A Yuli Zaasa",
    auth_username: "Kohigu Yuli (Username)",
    auth_email: "Email",
    auth_password: "Password",
    auth_terms_agree: "N saɣi ti SellerFlow Zalisi mini bɛ fukumsi zaasa.",
    auth_btn_create: "Kpɛhi Akawnt",
    auth_btn_signin: "Kpɛm",
    auth_continue_google: "Zaŋmi Google Kpɛm",
    auth_forgot_password: "A tam a password?",
    auth_switch_signin: "A mali akawnt kuro? Kpɛm kpe",
    auth_switch_register: "A nyɛla palli? Kpɛhimi akawnt palli",
    auth_back_feed: "← Labi For You",
    auth_verify_title: "Vihimi A Email",
    auth_verify_sub: "Lihimi a email puuni n-nyɛ gbaŋ maa.",
    auth_verify_sent_to: "Ti tim gbaŋ maa n-ti",
    auth_verify_check: "Lihimi Shɛhira Maa",
    auth_verify_resend: "Labisi Tim Email Maa Yaha",
    auth_verify_change_email: "Taɣi email / Kpɛm ni akawnt shɛli",
    
    settings_account_notif: "Akawnt mini Molini",
    settings_language: "Balli (Language)",
    settings_language_desc: "Gahimmi Ghana balli shɛli a ni bɔra.",
    settings_change_language: "Taɣi Balli",
    settings_notifications: "Wurilim Molini",
    settings_tutorial: "Bohimmi Di Tumtumsa",
    settings_terms: "Zalisi mini Fukumsi",
    settings_identity_verif: "Kohira Shɛhira",
    settings_start_verif: "Pilimmi Ghana Card Vihiro",
    settings_verified_badge: "Bɛ saɣi ti a viɛnyɛla ✓",
    
    lang_modal_title: "Gahimmi Balli",
    lang_search_placeholder: "Bohmimi Ghana balli…",
    lang_switched: "A taɣi balli maa viɛnyɛla",
    
    market_search_placeholder: "Bohmimi nɛma, bɔba, bee kohiriba…",
    market_all_cats: "Bɔba Zaasa",
    market_fashion: "Nɛnchari mini Kente",
    market_beauty: "Viɛlim Tuma",
    market_electronics: "Talifonnima mini Nɛma",
    market_food: "Bindirigu mini Nɛma",
    market_crafts: "Nucheeni Tuma",
    market_home: "Yiŋ Nɛma",
    market_add_cart: "Zaŋ Niŋ Adaka Puuni",
    market_buy_now: "Dam Saha Ŋɔ",
    market_contact_seller: "Bohimmi Kohira Maa",
    market_message_seller: "Timmi Gbaŋ",
    market_reviews: "Niriba Ni Yɛli Shɛm",
    market_in_stock: "Di Be Nimaani",
    market_out_of_stock: "Di Naaya",
    market_seller_verified: "Kohira Maŋmaŋa",
    market_follow: "Doli O",
    market_following: "A Doli O Mi",
    
    orders_empty: "A na bi da shɛli",
    checkout_title: "Yo Laɣiri",
    checkout_delivery_addr: "Luɣishɛli Di Ni Yɛn Chaŋ",
    checkout_region: "Yaɣili (Region)",
    checkout_phone: "Talifon Nɔmba zaŋ ti MoMo",
    checkout_payment_method: "Yobu Soya",
    checkout_cod: "Yom di yi paai (Cash on Delivery)",
    checkout_momo: "Mobile Money (MTN, Telecel, AT)",
    checkout_place_order: "Saɣiti Daabu Maa",
    checkout_total: "Laɣiri Zaasa",
    checkout_subtotal: "Nɛma Maa Laɣiri",
    checkout_fee: "Chandi Laɣiri",
    
    id_buyer_title: "Dahira Ghana Card Vihiro",
    id_seller_title: "Kohira Ghana Card Vihiro",
    id_mandatory_sub: "Ghana zaligu bɔrimi ni sokam zaŋ Ghana Card tum tuma.",
    id_private_heading: "Gubu Zaŋ Ti A Yɛla",
    id_card_number: "Ghana Card PIN",
    id_legal_name: "A Yuli Maŋmaŋa ŋan be Ghana Card maa zuɣu",
    id_front_photo: "Ghana Card Tooni Anfooni",
    id_back_photo: "Ghana Card Nyaanga Anfooni",
    id_liveness_selfie: "Yaami A Nini Anfooni",
    id_submit_btn: "Zaŋmi Ti Ka Bɛ Vihisi",
    id_status_verified: "Bɛ Saɣi Ti Li ✓",
    id_status_pending: "Kpambaliba Na Vihisirimi",
    
    btn_save: "Zaŋ Gbaai",
    btn_cancel: "Chɛli",
    btn_close: "Kparimi",
    btn_delete: "Nyɛhisi",
    btn_edit: "Taɣi",
    btn_update: "Labisi Tum",
    btn_submit: "Timmi",
    toast_saved: "Di gbaai viɛnyɛla",
    toast_loading: "Gulummi biɛla…",
    toast_network_error: "Intanɛt maa kani. Labisi nya.",
    toast_offline: "Intanɛt kani saha ŋɔ.",
    toast_online: "Intanɛt labina.",
    empty_no_items: "Shɛli kani kpe"
  },

  ha: {
    app_name: "SellerFlow",
    tagline: "Kasuwar zamani ta Ghana ta yan kasuwa da masu saya.",
    nav_for_you: "Dominka",
    nav_dashboard: "Dandalin Dan Kasuwa",
    nav_marketplace: "Kasuwa",
    nav_products: "Kayayyaki",
    nav_orders: "Odoji",
    nav_store: "Shagona",
    nav_analysis: "Bincike",
    nav_profile: "Bayanina",
    nav_settings: "Saituna",
    nav_chats: "Tattaunawa",
    nav_cart: "Kwandu",
    nav_admin: "Shugaba",
    nav_back: "← Koma Baya",
    nav_signin_register: "Shiga / Yi Rajista",
    nav_signout: "Fita",
    
    title_for_you: "Dominka",
    title_marketplace: "Kasuwar Ghana",
    title_products: "Kayayyakin Ka",
    title_orders: "Odojin Ka",
    title_store: "Shagon Ka",
    title_analysis: "Binciken Kasuwanci",
    title_profile: "Bayanin Asusu",
    title_settings: "Saituna",
    title_chats: "Tattaunawa",
    title_cart: "Kwandun Siyayya",
    title_notifications: "Sanarwa",
    title_dashboard: "Cibiyar Dan Kasuwa",
    
    sub_for_you: "Kalli bidiyon kayayyaki tare da gano ingantattun yan kasuwar Ghana.",
    sub_marketplace: "Nemi kyawawan kayan Ghana, abinci, sutura da kayan fasaha.",
    sub_products: "Sarrafa kayayyakin ka, farashi da adadin da kake dasu.",
    sub_orders: "Bibiyi odojin ka da kuma inda kayanka suka tsaya.",
    sub_store: "Tsara hoton shagon ka, tambari da jerin kayanka.",
    sub_analysis: "Kalli yadda cinikinka yake tafiya da kudaden da ka samu.",
    sub_profile: "Gyara cikakken sunan ka, email da hoton ka.",
    sub_settings: "Sarrafa asusun ka, yare, sanarwa da takardun shaida.",
    sub_chats: "Yi magana kai tsaye da masu saya da yan kasuwar Ghana.",
    sub_cart: "Duba kayayyakin da ke cikin kwandon ka kafin biya.",
    
    auth_create_account: "Bude Sabon Asusu",
    auth_welcome_back: "Barka da Dawowa",
    auth_sell_and_shop: "Sayar kuma ka sayi kaya a duk fadin Ghana.",
    auth_signin_continue: "Shiga ciki don ci gaba.",
    auth_fullname: "Cikakken Sunan Ka",
    auth_username: "Sunan Shago (Username)",
    auth_email: "Adireshin Email",
    auth_password: "Kalmar Sirri (Password)",
    auth_terms_agree: "Na yarda da Ka'idojin SellerFlow kuma zan yi aiki bisa doka.",
    auth_btn_create: "Bude Asusu",
    auth_btn_signin: "Shiga Ciki",
    auth_continue_google: "Yi amfani da Google",
    auth_forgot_password: "Ka manta kalmar sirri?",
    auth_switch_signin: "Kuna da asusu a baya? Shiga nan",
    auth_switch_register: "Sabon mai amfani? Bude asusu",
    auth_back_feed: "← Koma shafin For You",
    auth_verify_title: "Tabbatar da Email Dinka",
    auth_verify_sub: "Duba akwatin email dinka don danna hanyar tabbatarwa.",
    auth_verify_sent_to: "Mun tura sakon tabbatarwa zuwa ga",
    auth_verify_check: "Duba Tabbatarwa",
    auth_verify_resend: "Sake Tura Email",
    auth_verify_change_email: "Canza email / Shiga da wani asusun",
    
    settings_account_notif: "Asusu da Sanarwa",
    settings_language: "Yare (Language)",
    settings_language_desc: "Zabi yaren Ghana da kake so.",
    settings_change_language: "Canza Yare",
    settings_notifications: "Sanarwar Wayar Salula",
    settings_tutorial: "Jagorar Yadda Ake Aiki",
    settings_terms: "Sharuɗɗa da Ka'idoji",
    settings_identity_verif: "Tabbatar da Dan Kasuwa",
    settings_start_verif: "Fara Tabbatar da Ghana Card",
    settings_verified_badge: "An Tabbatar da Kai ✓",
    
    lang_modal_title: "Zabi Yare",
    lang_search_placeholder: "Nemi yaren Ghana…",
    lang_switched: "An canza yare cikin nasara",
    
    market_search_placeholder: "Nemi kaya, rukunin kaya ko yan kasuwa…",
    market_all_cats: "Duk Rukunai",
    market_fashion: "Sutura da Kente",
    market_beauty: "Kayan Kwalliya",
    market_electronics: "Wayoyi da Na'urori",
    market_food: "Abinci da Kayan Lambu",
    market_crafts: "Kayan Hannu da Fasaha",
    market_home: "Kayan Gida",
    market_add_cart: "Saka a Kwando",
    market_buy_now: "Saya Yanzu",
    market_contact_seller: "Kira Dan Kasuwa",
    market_message_seller: "Aika Sako",
    market_reviews: "Bayanin Masu Siyayya",
    market_in_stock: "Akwai Kaya",
    market_out_of_stock: "Kaya Sun Kare",
    market_seller_verified: "Ingantaccen Dan Kasuwa",
    market_follow: "Bi Shi",
    market_following: "Kana Binsa",
    
    orders_empty: "Ba ka sayi komai ba tukuna",
    checkout_title: "Biyan Kudi",
    checkout_delivery_addr: "Inda Za'a Kai Kaya",
    checkout_region: "Yanki (Region)",
    checkout_phone: "Lambar Waya ta MoMo",
    checkout_payment_method: "Hanyar Biya",
    checkout_cod: "Biya idan kaya sun iso (Cash on Delivery)",
    checkout_momo: "Mobile Money (MTN, Telecel, AT)",
    checkout_place_order: "Tabbatar da Odo",
    checkout_total: "Jimlar Kudi",
    checkout_subtotal: "Kudin Kaya",
    checkout_fee: "Kudin Kawo Kaya",
    
    id_buyer_title: "Tabbatar da Ghana Card na Mai Saya",
    id_seller_title: "Tabbatar da Ghana Card na Dan Kasuwa",
    id_mandatory_sub: "Dokar Ghana ta bukaci kowa ya nuna Ghana Card don kariya.",
    id_private_heading: "Cikakken Tsaro da Kariya",
    id_card_number: "Lambar Ghana Card (PIN)",
    id_legal_name: "Cikakken Sunanka a jikin Ghana Card",
    id_front_photo: "Hoton Gaban Ghana Card",
    id_back_photo: "Hoton Bayan Ghana Card",
    id_liveness_selfie: "Dauki Hoton Fuskarka",
    id_submit_btn: "Tura don Tantancewa",
    id_status_verified: "An Tabbatar ✓",
    id_status_pending: "Jami'an Tsaro na Dubawa",
    
    btn_save: "Ajiye",
    btn_cancel: "Soke",
    btn_close: "Rufe",
    btn_delete: "Goge",
    btn_edit: "Gyara",
    btn_update: "Sabunta",
    btn_submit: "Tura",
    toast_saved: "An ajiye cikin nasara",
    toast_loading: "Dan dakata kadan…",
    toast_network_error: "Babu hanyar sadarwa mai kyau. Sake gwadawa.",
    toast_offline: "Babu intanet a yanzu.",
    toast_online: "Intanet ya dawo.",
    empty_no_items: "Babu komai a nan"
  }
};

// Extensible translation builder: Generates clean dialectical defaults for the remaining regional Ghanaian languages
const REGIONAL_TRANSLATIONS = {
  nzi: {
    tagline: "Ghana eguadivo nee adɔlevolɛma be debieyɛlɛ bea.",
    nav_for_you: "Wɔ Ɛdeɛ", nav_marketplace: "Gua Nu", nav_products: "Ninyɛndane", nav_orders: "Ninyɛne Mɔɔ Bɛdɔ", nav_store: "Me Sitɔɔ", nav_settings: "Nziezielɛ", nav_cart: "Kɛntɛn", nav_chats: "Edwɛkɛ",
    auth_create_account: "Bɔ Akawnt Fofolɛ", auth_welcome_back: "Akwaaba Bieko", auth_btn_create: "Bɔ Akawnt", auth_btn_signin: "Wolo Nu",
    market_search_placeholder: "Kpondɛ ninyɛne, eguadivolɛma…", market_add_cart: "Fa Wula Kɛntɛn Nu", market_buy_now: "Tɔ Kɛkala",
    checkout_title: "Dua Kakɛ", btn_save: "Fa Sie", btn_cancel: "Gyakyi", toast_saved: "Ɛva ɛzie boɛ"
  },
  dga: {
    tagline: "Ghana daare yeng kpaaroŋ ane daare kpiɛroo.",
    nav_for_you: "Fo Dena", nav_marketplace: "Daa", nav_products: "Boma", nav_orders: "Boŋ Daare", nav_store: "N Sitoɔ", nav_settings: "Maaloŋ", nav_cart: "Kɔkɔre", nav_chats: "Yɛlɛ",
    auth_create_account: "Maal Akawnt Paala", auth_welcome_back: "Puo Fo Waaloŋ", auth_btn_create: "Maal Akawnt", auth_btn_signin: "Kpɛ",
    market_search_placeholder: "Bɔ boma, kpaareba…", market_add_cart: "De Eŋ Kɔkɔre Poɔ", market_buy_now: "Da Pampana",
    checkout_title: "Yuo Libie", btn_save: "De Bii", btn_cancel: "Basi", toast_saved: "A maaleŋ soŋ"
  },
  gon: {
    tagline: "Ghana edishe ebaŋ e-mɔ gbanshe.",
    nav_for_you: "Fɔ Gbanshe", nav_marketplace: "Gbaŋ", nav_products: "Enyurpu", nav_orders: "Enyurpu e-mɔ", nav_store: "N Sitɔɔ", nav_settings: "Aseto", nav_cart: "Daka", nav_chats: "Edɛ",
    auth_create_account: "Pono Akawnt Kɛkɛ", auth_welcome_back: "Kabire Mo", auth_btn_create: "Pono Akawnt", auth_btn_signin: "Lara",
    market_search_placeholder: "Bɔ enyurpu, asooreba…", market_add_cart: "Wɔ Daka Mɔ", market_buy_now: "Shɔ Ntono",
    checkout_title: "Pen Kura", btn_save: "Gbaai", btn_cancel: "Ta", toast_saved: "E gbaai baŋ"
  },
  kss: {
    tagline: "Ghana dige ba-diini te ba-luro ba logo.",
    nav_for_you: "N Mo", nav_marketplace: "Dage", nav_products: "Yoro", nav_orders: "Yoro daani", nav_store: "N Sitɔɔ", nav_settings: "Yeŋkoro", nav_cart: "Daga", nav_chats: "Sɔŋ",
    auth_create_account: "Paa Akawnt Falem", auth_welcome_back: "Dige Te Wa", auth_btn_create: "Paa Akawnt", auth_btn_signin: "Lwe",
    market_search_placeholder: "Bwe yoro, ba-luro…", market_add_cart: "Paane Daga Mo", market_buy_now: "De Nana",
    checkout_title: "Paa Koba", btn_save: "Gwa", btn_cancel: "Vo", toast_saved: "A gwa dedwe"
  },
  gur: {
    tagline: "Ghana dima la dasoba lagengɔ zi'an.",
    nav_for_you: "Ho Dini", nav_marketplace: "Da'a", nav_products: "Lɔgerɔ", nav_orders: "Ho Da'arɔ", nav_store: "N Sitɔɔ", nav_settings: "Malesi", nav_cart: "Daka", nav_chats: "Sɔlema",
    auth_create_account: "Maalɛ Akawnt Paala", auth_welcome_back: "Tuuma Tuuma", auth_btn_create: "Maalɛ Akawnt", auth_btn_signin: "Kpɛ",
    market_search_placeholder: "Ɛre lɔgerɔ, dasoba…", market_add_cart: "Dike Niŋ Daka Puan", market_buy_now: "Da'a Nanna",
    checkout_title: "Yɔ Ligiri", btn_save: "Gba'e", btn_cancel: "Basɛ", toast_saved: "A gba'e suŋa"
  },
  mma: {
    tagline: "Ghana dandiisi nima ni daha nima laɣimbu shee.",
    nav_for_you: "A Dini", nav_marketplace: "Daa", nav_products: "Nɛma", nav_orders: "A Daabu", nav_store: "N Sitɔɔ", nav_settings: "Maligu", nav_cart: "Adaka", nav_chats: "Yɛla",
    auth_create_account: "Nam Akawnt Palli", auth_welcome_back: "Pahi Nyaŋa", auth_btn_create: "Nam Akawnt", auth_btn_signin: "Kpɛma",
    market_search_placeholder: "Bɔhimi nɛma, kohiriba…", market_add_cart: "Niŋmi Adaka Puuni", market_buy_now: "Da Masuŋɔ",
    checkout_title: "Yo Laɣiri", btn_save: "Gbaami", btn_cancel: "Chɛli", toast_saved: "Di gbaai viɛnyɛla"
  },
  wal: {
    tagline: "Ghana daare kpaaroŋ zie.",
    nav_for_you: "Fo Dena", nav_marketplace: "Daa", nav_products: "Boma", nav_orders: "Boŋ Daare", nav_store: "N Sitɔɔ", nav_settings: "Maaligu", nav_cart: "Kɔkɔre", nav_chats: "Yɛlɛ",
    auth_create_account: "Maal Akawnt Paala", auth_welcome_back: "Fo Waaloŋ", auth_btn_create: "Maal Akawnt", auth_btn_signin: "Kpɛ",
    market_search_placeholder: "Bɔ boma, kpaareba…", market_add_cart: "De Eŋ Kɔkɔre Poɔ", market_buy_now: "Da Pampana",
    checkout_title: "Yuo Libie", btn_save: "De Bii", btn_cancel: "Basi", toast_saved: "A maaleŋ soŋ"
  },
  bis: {
    tagline: "Ghana yɛnda go yamba da.",
    nav_for_you: "Mba Dii", nav_marketplace: "Daa", nav_products: "Toma", nav_orders: "Daari Toma", nav_store: "N Sitɔɔ", nav_settings: "Gyɛnna", nav_cart: "Gbara", nav_chats: "Woto",
    auth_create_account: "Kɛ Akawnt Faa", auth_welcome_back: "Burka", auth_btn_create: "Kɛ Akawnt", auth_btn_signin: "Lɛɛ",
    market_search_placeholder: "Bɔ toma, yɛndaba…", market_add_cart: "Di Gbara Mba", market_buy_now: "Da Nanna",
    checkout_title: "Ya Wari", btn_save: "Gba", btn_cancel: "Tee", toast_saved: "A gba la"
  },
  kus: {
    tagline: "Ghana da'adib nɛ da'arib la'asug zin'ig.",
    nav_for_you: "Fʋ Din", nav_marketplace: "Da'a", nav_products: "La'ad", nav_orders: "Da'ar La'ad", nav_store: "M Sitɔɔ", nav_settings: "Maligim", nav_cart: "Kolug", nav_chats: "Labaya",
    auth_create_account: "Maal Akawnt Paal", auth_welcome_back: "Kenken", auth_btn_create: "Maal Akawnt", auth_btn_signin: "Kpɛm",
    market_search_placeholder: "Iedim la'ad, kuosidib…", market_add_cart: "Niŋim Kolugʋn", market_buy_now: "Da'am Nannanna",
    checkout_title: "Yɔɔm Ligidi", btn_save: "Gban'am", btn_cancel: "Basi", toast_saved: "Di maligya sʋŋa"
  },
  kdz: {
    tagline: "Ghana bibolmandan nyan bibool bi yool.",
    nav_for_you: "A Ya", nav_marketplace: "Kisaachor", nav_products: "Iwan", nav_orders: "Iwan I daan", nav_store: "M Sitɔɔ", nav_settings: "Ilal", nav_cart: "Kidik", nav_chats: "Tibɔr",
    auth_create_account: "Maan Akawnt Pɔn", auth_welcome_back: "N Doon", auth_btn_create: "Maan Akawnt", auth_btn_signin: "Koo",
    market_search_placeholder: "Uban iwan, bikolbi…", market_add_cart: "Leŋ Kidik Ni", market_buy_now: "Daa Dandana",
    checkout_title: "Taa Kibin", btn_save: "Goo", btn_cancel: "Dii", toast_saved: "I ti mann"
  },
  sil: {
    tagline: "Ghana damba wia kpaaroŋ.",
    nav_for_you: "Mo Dena", nav_marketplace: "Daa", nav_products: "Diila", nav_orders: "Diilahaŋ", nav_store: "N Sitɔɔ", nav_settings: "Nyesigi", nav_cart: "Kɔkɔre", nav_chats: "Wia",
    auth_create_account: "Nye Akawnt Paala", auth_welcome_back: "Baariŋ", auth_btn_create: "Nye Akawnt", auth_btn_signin: "Sula",
    market_search_placeholder: "Vila diila, kpaareba…", market_add_cart: "Di Eŋ Kɔkɔre", market_buy_now: "Da Fula",
    checkout_title: "Pia Libie", btn_save: "Gbaai", btn_cancel: "Taa", toast_saved: "A maaleŋ"
  },
  ada: {
    tagline: "Ghana jwali kɛ heli a blohu.",
    nav_for_you: "O Nɔ", nav_marketplace: "Jaa nɔ", nav_products: "Níhi", nav_orders: "Níhi nɛ a he", nav_store: "Ye Sitɔɔ", nav_settings: "Blɔnyɔɔ", nav_cart: "Kɛntɛn", nav_chats: "Sɛgbee",
    auth_create_account: "Pee Akawnt He", auth_welcome_back: "Atuu Kɛ Ekoŋ", auth_btn_create: "Pee Akawnt", auth_btn_signin: "Sɛɛ Emi",
    market_search_placeholder: "Hla níhi, jwalɔhi…", market_add_cart: "Wo Kɛntɛn Mi", market_buy_now: "He Amlɔ nɛ",
    checkout_title: "Wo Hio", btn_save: "To", btn_cancel: "Kpa", toast_saved: "E to saminya"
  }
};

// Merge regional language maps with standard English fallback base
Object.keys(REGIONAL_TRANSLATIONS).forEach(code => {
  translations[code] = {
    ...translations.en,
    ...REGIONAL_TRANSLATIONS[code]
  };
});

let _currentLanguage = 'en';

function initLanguage() {
  try {
    const saved = localStorage.getItem('sellerflow_language');
    if (saved && translations[saved]) {
      _currentLanguage = saved;
    } else {
      _currentLanguage = 'en';
    }
  } catch (e) {
    _currentLanguage = 'en';
  }
  return _currentLanguage;
}

function getLanguage() {
  return _currentLanguage || 'en';
}

function t(key, fallback = '') {
  if (!key) return fallback || '';
  const lang = _currentLanguage || 'en';
  const langObj = translations[lang];
  if (langObj && typeof langObj[key] === 'string' && langObj[key].trim() !== '') {
    return langObj[key];
  }
  const enObj = translations.en;
  if (enObj && typeof enObj[key] === 'string' && enObj[key].trim() !== '') {
    return enObj[key];
  }
  return fallback || key;
}

async function setLanguage(langCode, notifyUser = true) {
  if (!translations[langCode]) {
    console.warn(`[Translation]: Language '${langCode}' not supported. Falling back to English.`);
    langCode = 'en';
  }
  
  _currentLanguage = langCode;
  
  try {
    localStorage.setItem('sellerflow_language', langCode);
  } catch (e) {
    console.warn('[Translation]: LocalStorage write error:', e);
  }
  
  // Persist to Firestore if user is authenticated
  try {
    if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined' && db) {
      if (typeof updateDoc === 'function' && typeof doc === 'function') {
        updateDoc(doc(db, 'users', currentUser.uid), {
          language: langCode,
          updatedAt: typeof serverTimestamp === 'function' ? serverTimestamp() : new Date()
        }).catch(() => {});
      }
    }
    if (typeof currentProfile !== 'undefined' && currentProfile) {
      currentProfile.language = langCode;
    }
  } catch (e) {
    console.warn('[Translation]: Profile sync error:', e);
  }
  
  // Re-render Navigation and Active View dynamically without reloading page
  if (typeof updateAppLanguageUI === 'function') {
    updateAppLanguageUI();
  }
  
  if (notifyUser && typeof toast === 'function') {
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const langName = selectedLang ? selectedLang.native : langCode;
    toast(`${t('lang_switched', 'Language updated successfully')} (${langName})`, 'success', 3000);
  }
}

// Language selection modal
function openLanguageSelectorModal() {
  const current = getLanguage();
  const modalContent = `
    <div class="space-y-4 max-w-lg mx-auto text-left">
      <div class="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl shrink-0">
            🇬🇭
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-black text-white">${t('lang_modal_title', 'Select Language')}</h2>
            <p class="muted text-xs">${t('settings_language_desc', 'Choose your preferred Ghanaian language.')}</p>
          </div>
        </div>
        <button type="button" data-close-modal class="w-8 h-8 rounded-xl bg-[#1c1c1c] text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold border border-[#333]">✕</button>
      </div>
      
      <div class="relative">
        <input id="langSearchInput" type="text" placeholder="${t('lang_search_placeholder', 'Search Ghanaian language…')}" class="w-full bg-[#141414] border border-[#333] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:border-amber-400 outline-none">
        <span class="absolute right-3 top-2.5 text-zinc-500 text-sm">🔍</span>
      </div>
      
      <div id="langListContainer" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
        ${SUPPORTED_LANGUAGES.map(lang => {
          const isSelected = lang.code === current;
          return `
            <button type="button" data-lang-code="${lang.code}" class="lang-select-item p-3 rounded-xl border text-left flex items-center justify-between transition ${isSelected ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-bold shadow-sm' : 'bg-[#141414] border-[#292929] text-zinc-200 hover:bg-[#1f1f1f] hover:border-[#444]'}">
              <div class="min-w-0 pr-2">
                <div class="text-sm font-semibold truncate flex items-center gap-1.5">
                  <span>${lang.native}</span>
                  ${isSelected ? '<span class="text-xs text-amber-400 font-black">✓</span>' : ''}
                </div>
                <div class="text-[11px] text-zinc-400 truncate mt-0.5">${lang.name} · <span class="text-zinc-500">${lang.region}</span></div>
              </div>
              <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 text-zinc-400 border border-[#333] shrink-0">${lang.code}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  if (typeof modal === 'function') {
    modal(modalContent);
    
    // Attach search handler
    const searchInput = $('langSearchInput');
    const langItems = document.querySelectorAll('.lang-select-item');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        langItems.forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) ? 'flex' : 'none';
        });
      });
      searchInput.focus();
    }
    
    // Attach selection handlers
    langItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.langCode;
        if (code) {
          setLanguage(code, true);
          if (typeof closeModal === 'function') closeModal();
        }
      });
    });
  }
}

// Initialise upon file load
initLanguage();

// Export globals to window
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
window.translations = translations;
window.getLanguage = getLanguage;
window.getCurrentLanguage = getLanguage;
window.setLanguage = setLanguage;
window.t = t;
window.openLanguageSelectorModal = openLanguageSelectorModal;
