import welcomeGif from "../assets/imgs/screenshots-and-media/Welcome.gif";
import teamSelGif from "../assets/imgs/screenshots-and-media/TeamSel.gif";
import homePageGif from "../assets/imgs/screenshots-and-media/HomePage.gif";
import statsPageGif from "../assets/imgs/screenshots-and-media/StatsPage.gif";
import newsPageGif from "../assets/imgs/screenshots-and-media/Newspage.gif";
import languageSelGif from "../assets/imgs/screenshots-and-media/LanguageSel.gif";
import notifsGif from "../assets/imgs/screenshots-and-media/Notifs.gif";

const NflApp = ({ title, thumb }) => (
  <div>
    <h1>{title}</h1>
    <p className="badges-row">
      <img src="https://img.shields.io/badge/Platform-Android-green" alt="Android" draggable={false} />
      <img src="https://img.shields.io/badge/Language-Kotlin-orange" alt="Kotlin" draggable={false} />
      <img src="https://img.shields.io/badge/License-Educational-blue" alt="License" draggable={false} />
    </p>
    <p><em>This project is no longer being worked on.</em></p>
    <hr />
    <h2>Overview</h2>
    <p>
      The <strong>NFL Fan App</strong> is a mobile app designed for British/Welsh based American football fans who use Android.
      It provides access to team information, game schedules, push notifications, and news, making it a convenient hub for fans
      to follow the National Football League (NFL) on their mobile devices.
    </p>
    <hr />
    <h2>Key Features</h2>
    <ul>
      <li><strong>First-time Welcome Screen:</strong> Guides users through app functionality on first launch, allowing users to select their preffered language and their favourite team.</li>
      <li><strong>Shared Preferences:</strong> Saves users selected language and favourited team, saves users from having to do this everytime they open the app.</li>
      <li><strong>In-app Alarm Manager:</strong> Sends reminders for game start times.</li>
      <li><strong>Internet Connectivity Checks:</strong> Ensures network-dependent features work correctly offline.</li>
      <li><strong>Bilingual Support:</strong> Full English and Cymraeg (Welsh) translations are supported.</li>
      <li><strong>Push Notifications:</strong> Alerts users when games are about to start and sends users random NFL 'Fun Facts'.</li>
    </ul>
    <hr/>
    <h2>Application at a glance</h2>
    <h3>Welcome View</h3>
    <p>When users open the app for the first time they are greeted with a welcome screen where they're asked to select their language English or Cymraeg (Welsh).</p>
    <img src={welcomeGif} alt="Welcome Screen" draggable={false} />
    <h3>Team Selection View</h3>
    <p>Following the welcome users can pick their favourite team and can filter by conference.</p>
    <img src={teamSelGif} alt="Team Selection" draggable={false} />
    <h3>Home View</h3>
    <p>Users are then presented with the home screen, this is where users can view team lineups from the selected year as well as game history.</p>
    <img src={homePageGif} alt="Home Screen" draggable={false} />
    <h3>Stats View</h3>
    <p>Users can view upcoming games in the season as well as view statistics about past games, hall of famers and fun facts.</p>
    <img src={statsPageGif} alt="Statistics Screen" draggable={false} />
    <h3>News View</h3>
    <p>A webview connects directly with the NFL news site allowing users to get up to date news reports regarding the NFL.</p>
    <img src={newsPageGif} alt="News Screen" draggable={false} />
    <h3>Bilingual Support</h3>
    <p>The application support full translations of both English and Cymraeg (Welsh).</p>
    <img src={languageSelGif} alt="Bilingual Support" draggable={false} />
    <h3>Notifications</h3>
    <p>Users recieve notifications after not using the app for prolonged period of time with fun facts about NFL to push them to engage with using the app.</p>
    <img src={notifsGif} alt="Notifications" draggable={false} />
    <hr />
    <h2>Copyright, Trademark and General Notice</h2>
    <p>
      Please note if you install this application it will not work as shown the API Key has been removed, this project was built
      to support the <a href="https://api-sports.io/">https://api-sports.io/</a> NFL API.
    </p>
    <p>
      This app uses the <strong>NFL logo</strong>, WebView linking directly to the NFL website and official
      <strong>team logos</strong>, which are <strong>trademarks and copyrighted material owned by the National Football League (NFL)</strong>.
    </p>
    <p>
      All rights to these logos and trademarks remain with the NFL and respective teams. Their use in this project is for
      <strong>educational and non-commercial purposes only</strong>. No affiliation with or endorsement by the NFL or teams is implied.
    </p>
    <p>
      &copy; 2025 Morgan Burke. All rights reserved where applicable.
      This project is free to download and use for <strong>educational purposes only</strong>. Commercial use and distribution without credit
      is <strong>strictly prohibited</strong>.
    </p>
  </div>
);

export default NflApp;
