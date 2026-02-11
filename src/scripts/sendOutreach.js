require('dotenv').config();
const nodemailer = require('nodemailer');

// The list of schools we gathered
const schools = [
  // Original 8 schools from your list
//   { name: "DPS Sector 19", email: "dpsfbd@vsnl.com" },
//   { name: "Apeejay School", email: "skool.ms.fbd@apj.edu" },
//   { name: "Modern Vidya Niketan", email: "mvn@mvneducation.com" },
//   { name: "Aravali International School", email: "info.ais@aravali.edu.in" },
//   { name: "Eicher School", email: "admissioneicher@gmail.com" },
//   { name: "Homerton Grammar School", email: "homerton@homertongrammar.com" },
//   { name: "Manaskriti School", email: "admissions@manaskritischool.com" },
//   { name: "St. Thomas Sr. Sec. School", email: "st.thomasfbd@gmail.com" },

  // Additional 100+ schools from Faridabad
  { name: "Arqam Academy Senior Secondary School", email: "SKYLARK2016PS@GMAIL.COM" },
  { name: "Arya Vidya Mandir Sr. Secondary School", email: "drgsyprincipalavm@gmail.com" },
  { name: "Asha Jyoti Vidyapeeth", email: "ashajyotividyapeeth@gmail.com" },
  { name: "Ashirwad Public High School", email: "ashirwadschool90@gmail.com" },
  { name: "Ashok Memorial Public School", email: "mamtasingh185@gmail.com" },
  { name: "B N Public School", email: "BNPUBLICSCHOOL1983@GMAIL.COM" },
  { name: "Bal Kalyan Public Sr Sec School Manjhawali", email: "guruduttbalkalyan@gmail.com" },
  { name: "A.B.M Public School", email: "infoabmschool@gmail.com" },
  { name: "A.D. Senior Secondary School", email: "ad_school@rediffmail.com" },
  { name: "Adarsh Vidya Niketan Sr Sec School", email: "avnfbd@yahoo.com" },
  { name: "Aditya International School", email: "adityainternationalschool2008@gmail.com" },
  { name: "Aggarwal Public School Ballabgarh", email: "apsblb@rediffmail.com" },
  { name: "Aggarwal Public School Sector-3", email: "learn_share@yahoo.co.in" },
  { name: "Bansi Vidya Niketan Senior Secondary School", email: "bansividyaniketan00@gmail.com" },
  { name: "Bhawna Sr. Sec. School Rakhota", email: "shyamvirpooniya@yahoo.in" },
  { name: "Blue Angels Global School", email: "blueangelsschool@gmail.com" },
  { name: "Saraswati Global School", email: "info@saraswatiglobalschool.com" },
  { name: "Vidya Mandir Public School Sector-15A", email: "info@vidyamandirpublicschool.com" },
  { name: "Shreeram Model School Sector-21A", email: "info@shreerammodelschool.org" },
  { name: "Ryan International School Sector 21B", email: "ris.faridabad@ryangroup.org" },
  { name: "Apeejay Svran Global School Sector 21D", email: "info@asgs.apeejay.edu" },
  { name: "DPS Greater Faridabad Sector 81", email: "admission@dpsgfaridabad.com" },
  { name: "The Shriram Millennium School Sector-81", email: "info@tsms.org.in" },
  { name: "Apeejay School Sector 15", email: "info@apeejay.edu" },
  { name: "Delhi Public School Sector 19", email: "info@dpsfaridabad.com" },
  { name: "Modern Delhi Public School Sector 87", email: "info@mdpsfbd.com" },
  { name: "Scholars Pride School Sector 16", email: "info@scholarspride.edu.in" },
  { name: "Emerald Convent School Sector 79", email: "info@emeraldconvent.com" },
  { name: "Manav Rachna International School Sector 14", email: "info@mris.edu.in" },
  { name: "Manav Rachna International School Charmwood", email: "admissions.charmwood@mris.edu.in" },
  { name: "Manav Rachna International School Sector 21C", email: "admissions.sector21c@mris.edu.in" },
  { name: "Shiv Nadar School Greater Faridabad", email: "admissions.faridabad@shivnadarschool.edu.in" },
  { name: "Grand Columbus International School Sector 16A", email: "info@grandcolumbus.com" },
  { name: "Modern Delhi International School", email: "info@mdis.edu.in" },
  { name: "Homerton Grammar School Sector 21A", email: "admissions@homertongrammar.com" },
  { name: "K.R. Mangalam World School Sector 88", email: "info@krmangalam.com" },
  { name: "Millennium World School Sector 85", email: "info@millenniumworldschool.com" },
  { name: "Holy Child Public School", email: "info@holychildschool.com" },
  { name: "Heritage Global School", email: "info@heritageglobal.edu.in" },
  { name: "DAV Public School Faridabad", email: "info@davfaridabad.com" },
  { name: "The Modern School Faridabad", email: "info@modernschool.net" },
  { name: "Narayana e-Techno School Sector 77", email: "faridabad.sector77@narayanaschools.in" },
  { name: "Narayana e-Techno School Sector 87", email: "faridabad.sector87@narayanaschools.in" },
  { name: "GBN Senior Secondary School Sector 21D", email: "info@gbnschool.com" },
  { name: "Delhi Scholars International School", email: "info@delhischolars.com" },
  { name: "St. Joseph's Convent School Sector 5", email: "info@stjosephsfbd.com" },
  { name: "St. Peter's School Sector 16A", email: "info@stpeterschool.edu.in" },
  { name: "Delhi World Public School", email: "info@dwpsfbd.com" },
  { name: "Blooming Buds School", email: "info@bloomingbuds.edu.in" },
  { name: "Sanskriti School Faridabad", email: "info@sanskriti.edu.in" },
  { name: "Shanti Niketan Public School", email: "info@snpsfbd.com" },
  { name: "Green Valley Public School", email: "info@greenvalleyfbd.com" },
  { name: "Mount Litera Zee School", email: "faridabad@mountliterazeeschool.com" },
  { name: "Cambridge School Sector 27", email: "info@cambridgeschool.edu.in" },
  { name: "Amity International School Sector 43", email: "faridabad@amity.edu" },
  { name: "Lotus Valley International School", email: "info@lotusvalley.org" },
  { name: "Scottish High International School", email: "info@scottishhigh.com" },
  { name: "Presidium School Sector 57", email: "faridabad@presidium.edu.in" },
  { name: "Bal Bharati Public School", email: "info@bbpsfbd.com" },
  { name: "Bluebells School International", email: "info@bluebellsschool.com" },
  { name: "Crown Public School", email: "info@crownpublic.edu.in" },
  { name: "G.D. Goenka Public School Sector 48", email: "faridabad@gdgoenka.com" },
  { name: "Greenwood Public School", email: "info@greenwoodpublic.edu.in" },
  { name: "Holy Angels School", email: "info@holyangelsfbd.com" },
  { name: "Indian Public School", email: "info@ipsfbd.edu.in" },
  { name: "Jawahar Navodaya Vidyalaya", email: "jnv.faridabad@gmail.com" },
  { name: "Kendriya Vidyalaya Sector 8", email: "kvfaridabad@gmail.com" },
  { name: "Kendriya Vidyalaya NIT", email: "kvnit.faridabad@gmail.com" },
  { name: "Little Flower Convent School", email: "info@littleflower.edu.in" },
  { name: "Maharishi Vidya Mandir", email: "info@mvmfbd.com" },
  { name: "N.C. Jindal Public School", email: "info@ncjindal.com" },
  { name: "Navyug School Sector 15", email: "info@navyugschool.com" },
  { name: "New Green Field School", email: "info@ngfs.edu.in" },
  { name: "ODM Public School", email: "info@odmpublic.com" },
  { name: "Param Public School", email: "info@parampublic.edu.in" },
  { name: "Prince Public School", email: "info@princepublic.com" },
  { name: "Queen Mary's School", email: "info@queenmarys.edu.in" },
  { name: "Rainbow International School", email: "info@rainbowinternational.com" },
  { name: "Ramjas School", email: "info@ramjasfbd.com" },
  { name: "Saffron International School", email: "info@saffroninternational.com" },
  { name: "Saint Xavier's School", email: "info@stxaviersfbd.com" },
  { name: "Salwan Public School", email: "info@salwanfbd.com" },
  { name: "Sanfort World School", email: "faridabad@sanfort.com" },
  { name: "Sapphire International School", email: "info@sapphirefbd.com" },
  { name: "Shemford Futuristic School", email: "faridabad@shemford.com" },
  { name: "SKV Public School", email: "info@skvpublic.com" },
  { name: "St. Anne's Convent School", email: "info@stannesfbd.com" },
  { name: "St. Mary's Convent School", email: "info@stmarysfbd.com" },
  { name: "Suncity World School", email: "info@suncityworldschool.com" },
  { name: "Tagore Public School", email: "info@tagorepublic.edu.in" },
  { name: "The Modern School Ballabgarh", email: "info@modernballabgarh.com" },
  { name: "Uttam School for Girls", email: "info@uttamschool.com" },
  { name: "Vivekananda School", email: "info@vivekanandafbd.com" },
  { name: "Army Public School Faridabad", email: "aps.faridabad@gmail.com" },
  { name: "B.P.S. Public School Palwal", email: "info@bpspublic.com" },
  { name: "Bal Kalyan Public School", email: "info@balkalayanpublic.com" },
  { name: "Bright Scholars Senior Secondary School", email: "info@brightscholars.edu.in" },
  { name: "Central Academy Senior Secondary School", email: "info@centralacademy.edu.in" },
  { name: "Cosmos Public School", email: "info@cosmospublic.com" },
  { name: "D.A.V. Model School Sector 15", email: "davmodel.fbd@gmail.com" },
  { name: "Doon Public School Sector 40", email: "info@doonpublicfbd.com" },
  { name: "Euro International School", email: "info@eurointernational.edu.in" },
  { name: "G.B.L. Convent School", email: "info@gblconvent.com" },
  { name: "Galaxy Public School", email: "info@galaxypublic.edu.in" },
  { name: "Gita Convent School", email: "info@gitaconvent.com" },
  { name: "Golden Era School", email: "info@goldeneraschool.com" },
  { name: "Guardian Angel School", email: "info@guardianangel.edu.in" },
  { name: "Guru Harkrishan Public School", email: "info@ghpsfbd.com" },
  { name: "Hans Raj Model School", email: "info@hansrajmodel.com" },
  { name: "Indraprastha Public School", email: "info@indraprasthafbd.com" },
  { name: "K.L. International School", email: "info@klinternational.edu.in" },
  { name: "Karhana Sr. Sec. School", email: "info@karhanaschool.com" },
  { name: "Kids Kingdom School", email: "info@kidskingdom.edu.in" },
  { name: "Little Angels School", email: "info@littleangels.edu.in" },
  { name: "Moonlight Senior Secondary School", email: "info@moonlightschool.com" },
  { name: "N.K. Bagrodia Public School", email: "faridabad@nkbps.org" },
  { name: "New Era Public School", email: "info@newerapublic.com" },
  { name: "Oasis Public School", email: "info@oasispublic.edu.in" },
  { name: "Pacific World School", email: "info@pacificworld.edu.in" },
  { name: "R.P.S. International School", email: "info@rpsinternational.com" },
  { name: "Radiant International School", email: "info@radiantfbd.com" },
  { name: "Vardhman International Public School", email: "info@vardhmaniips.com" }
];


async function sendMails() {
    // 1. Setup the Transporter using your .env credentials
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    console.log("🚀 Starting email outreach...");

    for (const school of schools) {
        try {
            const mailOptions = {
                from: `"Ekansh | Meridian CMS" <${process.env.SMTP_FROM}>`,
                to: school.email,
                subject: "Make Your School AI-Powered with Meridian CMS",
                html: `
                    <p>Hello,</p>
                    <p>I’m <strong>Ekansh</strong>, founder of <strong>Meridian CMS</strong>.</p>
                    <p>We’ve built Meridian CMS, an AI-powered education management system designed to help schools like <strong>${school.name}</strong> manage students, teachers, attendance, fees, and assignments—all from one secure dashboard.</p>
                    <p>Our goal is to bring smart, AI-driven efficiency to educational institutions in Faridabad. We’re currently offering a <strong>free demo and trial</strong> so you can explore the platform without any commitment.</p>
                    <p>You can learn more here:<br>
                    <a href="https://www.meridiancms.tech">https://www.meridiancms.tech</a></p>
                    <p>I’d be happy to schedule a quick demo at your convenience.</p>
                    <br>
                    <p>Best regards,<br>
                    <strong>Ekansh</strong><br>
                    9999064875 - WhatsApp<br>
                    Founder, Meridian CMS</p>
                `,
            };

            let info = await transporter.sendMail(mailOptions);
            console.log(`✅ Sent to: ${school.name} (${info.messageId})`);
            
            // Wait 2 seconds between emails to avoid Gmail's spam filters
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`❌ Failed for ${school.name}:`, error.message);
        }
    }
    console.log("🏁 Outreach complete!");
}

sendMails();