// extraction/extract_and_load.js
require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const {
  GWAPPS_API_KEY, GWAPPS_EMAIL, GWAPPS_CUSTOMER_ID, GWAPPS_FORM_ID,
  NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME
} = process.env;

// 1) Authenticate
async function getGwToken() {
  const res = await axios.post('https://api.gwapps.com/v1/token', {
    key: GWAPPS_API_KEY,
    email: GWAPPS_EMAIL,
    customerId: GWAPPS_CUSTOMER_ID
  });
  return res.data.access_token;
}

// 2) Fetch records
async function fetchRecords(token) {
  const res = await axios.get(
    `https://api.gwapps.com/v1/forms/${GWAPPS_FORM_ID}/records`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.records || [];
}

// 3) Init Supabase
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const token = await getGwToken();
  const records = await fetchRecords(token);

  for (let rec of records) {
    const id = rec.id, f = rec.fields;
    let imageUrls = [];

    // download & re-upload each image
    for (let img of (f.images_extern1 || [])) {
      const imgRes = await axios.get(img.url, { responseType: 'arraybuffer' });
      const path   = `${id}/${img.name}`;
      await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .upload(path, Buffer.from(imgRes.data), { upsert: true });
      const { publicURL } = supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .getPublicUrl(path);
      imageUrls.push(publicURL);
    }

    // build payload
    const payload = {
      id,
      first_name:          f.text_field2,
      last_name:           f.text_field4,
      city:                f.city1,
      state:               f.state1,
      date_of_birth:       f.date_of_birth1,
      gender:              f.gender1,
      sexual_orientation:  f.sexual_orient1,
      lifestyle_interests: f.dropdown13,
      physical_activities: f.dropdown14,
      rating:              f.number_field1,
      phone:               f.phone1,
      email:               f.email1,
      country:             f.country1,
      height_inches:       f.height_inches1,
      dating_objectives:   f.dating_object2,
      weight:              f.number_field2,
      hair_color:          f.hair_color1,
      ethnicity:           f.ethnicity2,
      family_goals:        f.family_plans1,
      number_of_kids:      f.kids1,
      hometown:            f.born_raised1,
      education_level:     f.education1,
      political_views:     f.dropdown4,
      drinking:            f.drinking1,
      smoking:             f.smoking1,
      eye_color:           f.eye_color1,
      religion:            f.religion2,
      college_university:  f.education_mor1,
      tattoos:             f.tattoos || null,
      occupation:          f.text_field11,
      zip:                 f.zip1,
      metropolitan_area:   f.metropolitan_1,
      preferences: {
        preferred_hair_color: f.hair_color2,
        preferred_eye_color:  f.eye_color2,
        preferred_body_type:  f.preferred_bod2,
        preferred_height:     f.preferred_hei1,
        preferred_age_low:    f.text_field7,
        preferred_age_high:   f.text_field8,
        preferred_religion:   f.religion1,
        preferred_political:  f.dropdown8,
        preferred_marital:    f.dropdown7,
        preferred_education:  f.dropdown6,
        preferred_ethnicity:  f.ethnicity3,
        drinking_pref:        f.dropdown3,
        smoking_pref:         f.smoking_prefe2,
        preferred_gender:     f.preferred_gen1,
        relocation:           f.relocation_pr1,
        relocation_detail:    f.text_field1,
        match_kids_ok:        f.are_they_ok_i1,
        match_kids_detail:    f.kids_preferen1,
        tattoos_pref:         f.tattoos_preferen1
      },
      images: imageUrls
    };

    // insert/update
    await supabase.from('singles').upsert(payload);
    console.log(`Imported ${id}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
