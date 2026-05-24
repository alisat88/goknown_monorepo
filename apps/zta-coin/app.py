import streamlit as st
import requests
import os

# ============================================
# CONFIG
# ============================================

BACKEND_URL = os.getenv("BACKEND_URL", "https://dappgenius-demo-1.onrender.com").rstrip("/")

ALLOWED_USERS = ["Mike", "Connie", "Chuck", "Chand", "Alisa"]


def get_secret_config(name):
    value = os.getenv(name)
    if value:
        return value.strip()

    try:
        value = st.secrets.get(name)
    except Exception:
        value = None

    return str(value).strip() if value else ""


ADMIN_USERNAME = get_secret_config("ZTA_ADMIN_USERNAME")
ADMIN_PASSWORD = get_secret_config("ZTA_ADMIN_PASSWORD")
ADMIN_LOGIN_CONFIGURED = bool(ADMIN_USERNAME and ADMIN_PASSWORD)

st.set_page_config(page_title="GoKnown Payment Demo", layout="wide")

# ============================================
# 🎨 DARK THEME
# ============================================

THEME = {
    "bg": "#070920",
    "bg_mid": "#000034",
    "bg_deep": "#061827",
    "accent": "#53bf99",
    "cyan": "#8be7d7",
    "blue": "#2563eb",
    "text": "#f8fafc",
    "muted": "#98a8bc",
}

st.markdown(f"""
<style>
:root {{
    --gk-bg: {THEME["bg"]};
    --gk-bg-mid: {THEME["bg_mid"]};
    --gk-bg-deep: {THEME["bg_deep"]};
    --gk-accent: {THEME["accent"]};
    --gk-cyan: {THEME["cyan"]};
    --gk-blue: {THEME["blue"]};
    --gk-text: {THEME["text"]};
    --gk-muted: {THEME["muted"]};
}}

html, body, [data-testid="stAppViewContainer"] {{
    background:
        radial-gradient(circle at 18% 8%, rgba(83, 191, 153, 0.16), transparent 28%),
        linear-gradient(135deg, var(--gk-bg) 0%, var(--gk-bg-mid) 48%, var(--gk-bg-deep) 100%);
    color: var(--gk-text);
}}

body, input, button, textarea, select {{
    font-family: "Open Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}}

[data-testid="stHeader"] {{
    background: rgba(3, 7, 32, 0.72);
    border-bottom: 1px solid rgba(83, 191, 153, 0.12);
    backdrop-filter: blur(16px);
}}

.block-container {{
    max-width: 1240px;
    padding-top: 2rem;
    padding-bottom: 4rem;
}}

h1, h2, h3 {{
    color: var(--gk-text);
    font-weight: 800;
    letter-spacing: 0;
}}

label, [data-testid="stWidgetLabel"] p {{
    color: #c9d6e5 !important;
    font-size: 0.88rem;
    font-weight: 700;
}}

.gk-topbar {{
    margin-bottom: 1.4rem;
    padding: 1.2rem 1.35rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid rgba(83, 191, 153, 0.18);
    border-radius: 18px;
    background: rgba(3, 7, 32, 0.74);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(16px);
}}

.gk-brand {{
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
}}

.gk-mark {{
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: var(--gk-cyan);
    font-weight: 800;
    background: rgba(83, 191, 153, 0.13);
    border: 1px solid rgba(83, 191, 153, 0.28);
}}

.gk-eyebrow {{
    color: var(--gk-cyan);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}}

.gk-title {{
    margin-top: 0.25rem;
    color: var(--gk-text);
    font-size: 1.75rem;
    line-height: 1.1;
    font-weight: 800;
}}

.gk-status-pill {{
    flex: 0 0 auto;
    padding: 0.62rem 0.85rem;
    border: 1px solid rgba(83, 191, 153, 0.26);
    border-radius: 12px;
    color: #dffcf4;
    background: rgba(83, 191, 153, 0.1);
    font-size: 0.82rem;
    font-weight: 800;
}}

.card {{
    min-height: 122px;
    padding: 20px;
    border: 1px solid rgba(83, 191, 153, 0.2);
    border-radius: 18px;
    margin-bottom: 20px;
    background: linear-gradient(145deg, rgba(12, 24, 54, 0.86), rgba(2, 8, 23, 0.72));
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
}}

.section-title {{
    color: var(--gk-muted);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 12px;
}}

.metric {{
    color: var(--gk-text);
    font-size: 32px;
    line-height: 1.1;
    font-weight: 800;
}}

.small-text {{
    margin-top: 10px;
    color: var(--gk-accent);
    font-weight: 700;
}}

[data-testid="stMetric"] {{
    padding: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.72);
}}

[data-testid="stMetric"] label p {{
    color: var(--gk-muted) !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}}

[data-testid="stMetricValue"] {{
    color: var(--gk-text);
    font-weight: 800;
}}

.stButton > button {{
    min-height: 46px;
    border: 1px solid rgba(103, 232, 249, 0.32);
    border-radius: 12px;
    padding: 0 1rem;
    background: linear-gradient(90deg, var(--gk-blue) 0%, #0891b2 100%);
    color: #fff;
    font-weight: 800;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
    transition: transform 0.2s, border-color 0.2s, filter 0.2s;
}}

.stButton > button:hover {{
    border-color: rgba(139, 231, 215, 0.65);
    color: #fff;
    filter: brightness(1.08);
    transform: translateY(-1px);
}}

[data-testid="stSidebar"] {{
    background: rgba(6, 10, 31, 0.96);
    border-right: 1px solid rgba(83, 191, 153, 0.18);
    box-shadow: 18px 0 45px rgba(0, 0, 0, 0.28);
}}

[data-testid="stSidebar"] .block-container {{
    padding-top: 1.4rem;
}}

.gk-sidebar-brand {{
    padding: 0.85rem 0 1rem;
    border-bottom: 1px solid rgba(83, 191, 153, 0.14);
    margin-bottom: 1rem;
}}

.gk-sidebar-brand strong {{
    display: block;
    color: var(--gk-text);
    font-size: 1.05rem;
}}

.gk-sidebar-brand span {{
    display: block;
    margin-top: 0.25rem;
    color: var(--gk-muted);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}}

[data-baseweb="select"] > div,
[data-testid="stNumberInput"] input,
[data-testid="stTextInput"] input {{
    min-height: 46px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.82);
    color: var(--gk-text);
    box-shadow: none;
}}

[data-baseweb="select"] > div:hover,
[data-testid="stNumberInput"] input:hover,
[data-testid="stTextInput"] input:hover {{
    border-color: rgba(83, 191, 153, 0.42);
}}

[data-baseweb="popover"],
[data-baseweb="menu"] {{
    background: #0f172a;
    color: var(--gk-text);
}}

[data-testid="stAlert"] {{
    border-radius: 14px;
    border: 1px solid rgba(83, 191, 153, 0.18);
    background: rgba(15, 23, 42, 0.82);
}}

[data-testid="stJson"] {{
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 14px;
    background: rgba(2, 8, 23, 0.76);
}}

@media (max-width: 760px) {{
    .block-container {{
        padding: 1.25rem 1rem 3rem;
    }}

    .gk-topbar {{
        align-items: flex-start;
        flex-direction: column;
        padding: 1rem;
    }}

    .gk-title {{
        font-size: 1.35rem;
    }}
}}
</style>
""", unsafe_allow_html=True)


def render_topbar(title, eyebrow="GoKnown Payment Demo"):
    st.markdown(
        f"""
        <div class="gk-topbar">
            <div class="gk-brand">
                <div class="gk-mark">GK</div>
                <div>
                    <div class="gk-eyebrow">{eyebrow}</div>
                    <div class="gk-title">{title}</div>
                </div>
            </div>
            <div class="gk-status-pill">ZTA Coin Network</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_sidebar():
    with st.sidebar:
        st.markdown(
            """
            <div class="gk-sidebar-brand">
                <strong>GoKnown</strong>
                <span>Payment demo</span>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Logout"):
            st.session_state.authenticated = False
            st.rerun()

# ============================================
# 🔐 AUTH STATE
# ============================================

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False

# ============================================
# 🔐 LOGIN SCREEN
# ============================================

if not st.session_state.authenticated:
    render_topbar("🔐 Admin Login")

    if not ADMIN_LOGIN_CONFIGURED:
        st.error(
            "Admin login is not configured. Set ZTA_ADMIN_USERNAME and "
            "ZTA_ADMIN_PASSWORD before using this app."
        )
        st.stop()

    username = st.text_input("Username")
    password = st.text_input("Password", type="password")

    if st.button("Login"):
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            st.session_state.authenticated = True
            st.success("✅ Login successful!")
            st.rerun()
        else:
            st.error("❌ Invalid credentials")

    st.stop()

# ============================================
# 💰 MAIN APP
# ============================================

render_sidebar()
render_topbar("💳 ZTA Coin Dashboard")

# ============================================
# 📊 TOP CARDS
# ============================================

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    <div class="card">
        <div class="section-title">Secured on Ledger</div>
        <div class="metric">100%</div>
        <div class="small-text">Fully encrypted</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="card">
        <div class="section-title">System Status</div>
        <div class="metric">ACTIVE</div>
        <div class="small-text">All systems operational</div>
    </div>
    """, unsafe_allow_html=True)

# ============================================
# 🪙 MINT + TRANSFER (SIDE BY SIDE)
# ============================================

col1, col2 = st.columns(2)

# MINT
with col1:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### 🪙 Mint Tokens")

    mint_user = st.selectbox("Select User", ALLOWED_USERS)
    mint_amount = st.number_input("Amount to Mint", min_value=1, value=100)

    if st.button("Mint Tokens"):
        try:
            response = requests.post(
                f"{BACKEND_URL}/mint",
                json={"user_id": mint_user, "amount": mint_amount}
            )

            st.write("Status Code:", response.status_code)
            st.write("Raw Response:", response.text)

            try:
                st.json(response.json())
            except:
                st.error("Response is not valid JSON")

        except Exception as e:
            st.error(f"⚠️ Connection failed: {e}")

    st.markdown('</div>', unsafe_allow_html=True)

# TRANSFER
with col2:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### 💸 Transfer Tokens")

    from_user = st.selectbox("From User", ALLOWED_USERS, key="from_user")
    to_user = st.selectbox("To User", ALLOWED_USERS, key="to_user")

    transfer_amount = st.number_input(
        "Amount to Transfer",
        min_value=1,
        value=50,
        key="transfer"
    )

    if st.button("Send Money"):
        if from_user == to_user:
            st.error("❌ Sender and receiver must be different")
        else:
            try:
                response = requests.post(
                    f"{BACKEND_URL}/transfer",
                    json={
                        "from_user": from_user,
                        "to_user": to_user,
                        "amount": transfer_amount
                    }
                )

                st.write("Status Code:", response.status_code)
                st.write("Raw Response:", response.text)

                try:
                    st.json(response.json())
                except:
                    st.error("Response is not valid JSON")

            except Exception as e:
                st.error(f"⚠️ Connection failed: {e}")

    st.markdown('</div>', unsafe_allow_html=True)

# ============================================
# 📊 VELOCITY SECTION
# ============================================

st.markdown('<div class="card">', unsafe_allow_html=True)
st.markdown("## 📊 Account Velocity Monitoring")

velocity_account = st.selectbox("Select Account", ALLOWED_USERS, key="velocity")

if st.button("Check Velocity"):
    try:
        response = requests.get(
            f"{BACKEND_URL}/velocity/{velocity_account}"
        )

        st.write("Status Code:", response.status_code)
        st.write("Raw Response:", response.text)

        try:
            data = response.json()

            col1, col2 = st.columns(2)

            with col1:
                st.metric("Total volume (1 min)", data["last1minVolume"])
                st.metric("Total volume (5 min)", data["last5minVolume"])

            with col2:
                st.metric("Total volume (1 hour)", data["last1hrVolume"])
                st.metric("Total transactions (5 min)", data["txCountLast5min"])

            if data.get("isSuspicious"):
                st.error("🚨 Suspicious activity detected!")
            else:
                st.success("✅ Normal activity")

        except:
            st.error("Response is not valid JSON")

    except Exception as e:
        st.error(f"⚠️ Connection failed: {e}")

st.markdown('</div>', unsafe_allow_html=True)

# ============================================
# 🔧 SYSTEM STATUS
# ============================================

st.markdown('<div class="card">', unsafe_allow_html=True)
st.markdown("## 🔧 System Status")

if st.button("Check Backend Health"):
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        st.success("Backend is running!")
        st.write(response.text)
    except:
        st.error("Backend is NOT reachable")

st.markdown('</div>', unsafe_allow_html=True)
