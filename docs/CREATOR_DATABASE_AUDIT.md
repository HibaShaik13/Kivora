# Kivora — Complete Creator Database Audit & Name Export

> **Database File Inspected:** `D:/dOWNLOADS/Kivora (2)/Kivora/kivora.db`  
> **Database Connection URL:** `sqlite:///D:/dOWNLOADS/Kivora (2)/Kivora/kivora.db`  
> **Audit Date & Time:** 2026-10-14  
> **Audit Type:** Read-Only Relational Inspection

---

## 1. Executive Summary & Exact Creator Counts

| Metric | Count | Description |
| :--- | :---: | :--- |
| **Total Registered Creator Accounts** | **219** | Users with `role == 'CREATOR'` in `users` table |
| **Total Creator Profiles** | **158** | Active records in `creator_profiles` table |
| **Creator Accounts Awaiting Profile** | **61** | Registered creator accounts without a profile row |
| **Marketplace Verified Creators** | **69** | Tier `VERIFIED_PRO` (52) or `TOP_STUDIO` (17) |
| **Marketplace Unverified / Community** | **89** | Tier `COMMUNITY` (88) or `UNVERIFIED` (1) |
| **Available Creators** | **122** | Availability status: `AVAILABLE` |
| **Booked Creators** | **28** | Availability status: `BOOKED` |
| **Limited Availability Creators** | **8** | Availability status: `LIMITED` |
| **Duplicate `user_id` in Profiles** | **0** | Strict 1-to-1 database foreign key integrity |
| **Orphaned Creator Profiles** | **0** | Every creator profile maps to an existing user |
| **Duplicate Display Names** | **1** | Only `'Test User'` appears 7 times (distinguished by ID & handle) |

---

## 2. Technical Findings & Architectural Scope

1. **Data Model Architecture:**
   - Creator identity is split into authentication metadata (`users` table) and creative portfolio metadata (`creator_profiles` table).
   - `User.role` designates account role (`CREATOR`, `BRAND`, `ADMIN`). Names are stored exclusively in `creator_profiles.display_name`.
2. **Explanation of Count Differences (219 Accounts vs. 158 Profiles):**
   - Kivora registration is a phased lifecycle: (1) Account registration, (2) Email OTP verification, (3) Profile initialization (`/api/creators/profile`).
   - 61 accounts are registered creator users created during automated integration tests or pending onboarding who have not yet submitted their creator profile form.
3. **Verification Definition:**
   - In Kivora's matching and discovery engine (`backend/app/api/creators.py`), verified creators are defined as those in `VERIFIED_PRO` (52) or `TOP_STUDIO` (17) tiers (total **69**).
   - Unverified creators are in the default `COMMUNITY` (88) or `UNVERIFIED` (1) tiers (total **89**).

---

## 3. Complete List of All 158 Creators with Profiles

| # | Full Name | Handle | Verification Tier | Availability | Profile ID | User ID | Rating |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **Alex Rivera** | `@arivera_motion` | `VERIFIED_PRO` | `AVAILABLE` | `creator-alex-rivera` | `user-creator-5` | ★ 4.9 |
| 2 | **Alina Morin** | `@alina_morin_27` | `COMMUNITY` | `BOOKED` | `cr-synth-027` | `usr-synth-cr-027` | ★ 4.8 |
| 3 | **Alina Nakamura** | `@alina_nakamura_77` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-077` | `usr-synth-cr-077` | ★ 4.8 |
| 4 | **Amara Cross** | `@amara_cross_61` | `COMMUNITY` | `AVAILABLE` | `cr-synth-061` | `usr-synth-cr-061` | ★ 4.8 |
| 5 | **Amara Rousseau** | `@amara_rousseau_11` | `COMMUNITY` | `AVAILABLE` | `cr-synth-011` | `usr-synth-cr-011` | ★ 5.0 |
| 6 | **Ananya Ito** | `@ananya_ito_96` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-096` | `usr-synth-cr-096` | ★ 4.9 |
| 7 | **Ananya Sharma** | `@ananya_social` | `COMMUNITY` | `AVAILABLE` | `creator-ananya-sharma` | `user-creator-12` | ★ 4.8 |
| 8 | **Ananya Sinclair** | `@ananya_sinclair_46` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-046` | `usr-synth-cr-046` | ★ 4.8 |
| 9 | **Aria Ashford** | `@aria_ashford_101` | `COMMUNITY` | `AVAILABLE` | `cr-synth-101` | `usr-synth-cr-101` | ★ 5.0 |
| 10 | **Aria Novak** | `@aria_novak_51` | `COMMUNITY` | `BOOKED` | `cr-synth-051` | `usr-synth-cr-051` | ★ 4.9 |
| 11 | **Aria Vance** | `@aria_vance_01` | `COMMUNITY` | `AVAILABLE` | `cr-synth-001` | `usr-synth-cr-001` | ★ 4.9 |
| 12 | **Astrid Kovacs** | `@astrid_kovacs_66` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-066` | `usr-synth-cr-066` | ★ 5.0 |
| 13 | **Astrid Valenti** | `@astrid_valenti_16` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-016` | `usr-synth-cr-016` | ★ 4.9 |
| 14 | **Bryn Sinclair** | `@bryn_sinclair_78` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-078` | `usr-synth-cr-078` | ★ 4.8 |
| 15 | **Bryn Thorne** | `@bryn_thorne_28` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-028` | `usr-synth-cr-028` | ★ 5.0 |
| 16 | **Callum Brandt** | `@callum_brandt_22` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-022` | `usr-synth-cr-022` | ★ 4.8 |
| 17 | **Callum Vargas** | `@callum_vargas_72` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-072` | `usr-synth-cr-072` | ★ 4.8 |
| 18 | **Cassian Bergman** | `@cassian_bergman_39` | `COMMUNITY` | `BOOKED` | `cr-synth-039` | `usr-synth-cr-039` | ★ 4.7 |
| 19 | **Cassian Castillo** | `@cassian_castillo_89` | `COMMUNITY` | `AVAILABLE` | `cr-synth-089` | `usr-synth-cr-089` | ★ 4.8 |
| 20 | **Chloe Bergman** | `@chloe_bergman_07` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-007` | `usr-synth-cr-007` | ★ 4.8 |
| 21 | **Chloe Castillo** | `@chloe_castillo_57` | `COMMUNITY` | `BOOKED` | `cr-synth-057` | `usr-synth-cr-057` | ★ 4.9 |
| 22 | **Chloé Dupont** | `@chloe_vfx` | `VERIFIED_PRO` | `AVAILABLE` | `creator-chloe-dupont` | `user-creator-10` | ★ 4.9 |
| 23 | **Corin Hawthorne** | `@corin_hawthorne_47` | `COMMUNITY` | `AVAILABLE` | `cr-synth-047` | `usr-synth-cr-047` | ★ 4.9 |
| 24 | **Corin Vance** | `@corin_vance_97` | `COMMUNITY` | `AVAILABLE` | `cr-synth-097` | `usr-synth-cr-097` | ★ 4.9 |
| 25 | **Cyrus Cross** | `@cyrus_cross_29` | `COMMUNITY` | `AVAILABLE` | `cr-synth-029` | `usr-synth-cr-029` | ★ 4.8 |
| 26 | **Cyrus Hawthorne** | `@cyrus_hawthorne_79` | `COMMUNITY` | `AVAILABLE` | `cr-synth-079` | `usr-synth-cr-079` | ★ 4.8 |
| 27 | **Dante Ito** | `@dante_ito_64` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-064` | `usr-synth-cr-064` | ★ 4.7 |
| 28 | **Dante Sinclair** | `@dante_sinclair_14` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-014` | `usr-synth-cr-014` | ★ 4.9 |
| 29 | **Daphne Holloway** | `@daphne_holloway_82` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-082` | `usr-synth-cr-082` | ★ 5.0 |
| 30 | **Daphne Ito** | `@daphne_ito_32` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-032` | `usr-synth-cr-032` | ★ 4.8 |
| 31 | **Devon Ross** | `@devon_audio_vis` | `COMMUNITY` | `AVAILABLE` | `creator-devon-ross` | `user-creator-7` | ★ 4.8 |
| 32 | **Eden Kallio** | `@eden_kallio_84` | `TOP_STUDIO` | `BOOKED` | `cr-synth-084` | `usr-synth-cr-084` | ★ 5.0 |
| 33 | **Eden Kovacs** | `@eden_kovacs_34` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-034` | `usr-synth-cr-034` | ★ 4.9 |
| 34 | **Elena Rostova** | `@elena_creative` | `VERIFIED_PRO` | `AVAILABLE` | `creator-elena-rostova` | `user-creator-1` | ★ 5.0 |
| 35 | **Elodie Kovacs** | `@elodie_kovacs_98` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-098` | `usr-synth-cr-098` | ★ 4.9 |
| 36 | **Elodie Valenti** | `@elodie_valenti_48` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-048` | `usr-synth-cr-048` | ★ 4.7 |
| 37 | **Ezra Bergman** | `@ezra_bergman_71` | `COMMUNITY` | `AVAILABLE` | `cr-synth-071` | `usr-synth-cr-071` | ★ 4.8 |
| 38 | **Ezra Fairchild** | `@ezra_fairchild_21` | `TOP_STUDIO` | `BOOKED` | `cr-synth-021` | `usr-synth-cr-021` | ★ 4.8 |
| 39 | **Felix Althaus** | `@felix_althaus_41` | `COMMUNITY` | `AVAILABLE` | `cr-synth-041` | `usr-synth-cr-041` | ★ 4.7 |
| 40 | **Felix Morin** | `@felix_morin_91` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-091` | `usr-synth-cr-091` | ★ 4.9 |
| 41 | **Finn Lindqvist** | `@finn_lindqvist_24` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-024` | `usr-synth-cr-024` | ★ 4.9 |
| 42 | **Finn Montague** | `@finn_montague_74` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-074` | `usr-synth-cr-074` | ★ 5.0 |
| 43 | **Freja Althaus** | `@freja_althaus_09` | `COMMUNITY` | `BOOKED` | `cr-synth-009` | `usr-synth-cr-009` | ★ 4.7 |
| 44 | **Freja Morin** | `@freja_morin_59` | `COMMUNITY` | `AVAILABLE` | `cr-synth-059` | `usr-synth-cr-059` | ★ 4.8 |
| 45 | **Gabe Davenport** | `@gabe_davenport_31` | `COMMUNITY` | `AVAILABLE` | `cr-synth-031` | `usr-synth-cr-031` | ★ 4.9 |
| 46 | **Gabe Fontaine** | `@gabe_fontaine_81` | `COMMUNITY` | `BOOKED` | `cr-synth-081` | `usr-synth-cr-081` | ★ 4.9 |
| 47 | **Hassan Khalil** | `@hassan_automotive` | `TOP_STUDIO` | `AVAILABLE` | `creator-hassan-khalil` | `user-creator-13` | ★ 5.0 |
| 48 | **Hiba** | `@hiba_7fb4` | `COMMUNITY` | `AVAILABLE` | `cr-7db989c3ae99` | `user-fc4dfa68f54d` | ★ 5.0 |
| 49 | **Inez Montague** | `@inez_montague_42` | `TOP_STUDIO` | `BOOKED` | `cr-synth-042` | `usr-synth-cr-042` | ★ 4.9 |
| 50 | **Inez Thorne** | `@inez_thorne_92` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-092` | `usr-synth-cr-092` | ★ 4.8 |
| 51 | **Jonas Cross** | `@jonas_cross_93` | `COMMUNITY` | `BOOKED` | `cr-synth-093` | `usr-synth-cr-093` | ★ 5.0 |
| 52 | **Jonas Rousseau** | `@jonas_rousseau_43` | `COMMUNITY` | `AVAILABLE` | `cr-synth-043` | `usr-synth-cr-043` | ★ 4.8 |
| 53 | **Julian Chen** | `@julian_chen_06` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-006` | `usr-synth-cr-006` | ★ 5.0 |
| 54 | **Julian Lindqvist** | `@julian_lindqvist_56` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-056` | `usr-synth-cr-056` | ★ 4.8 |
| 55 | **Kaelen Holloway** | `@kaelen_holloway_50` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-050` | `usr-synth-cr-050` | ★ 4.9 |
| 56 | **Kaelen Winter** | `@kaelen_winter_100` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-100` | `usr-synth-cr-100` | ★ 4.8 |
| 57 | **Kai Chen** | `@kai_chen_102` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-102` | `usr-synth-cr-102` | ★ 4.8 |
| 58 | **Kai Kallio** | `@kai_kallio_52` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-052` | `usr-synth-cr-052` | ★ 4.7 |
| 59 | **Kai Kovacs** | `@kai_kovacs_02` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-002` | `usr-synth-cr-002` | ★ 4.8 |
| 60 | **Kai Tanaka** | `@kai_anime` | `COMMUNITY` | `AVAILABLE` | `creator-kai-tanaka` | `user-creator-3` | ★ 4.8 |
| 61 | **Kenji Montague** | `@kenji_montague_10` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-010` | `usr-synth-cr-010` | ★ 5.0 |
| 62 | **Kenji Thorne** | `@kenji_thorne_60` | `VERIFIED_PRO` | `LIMITED` | `cr-synth-060` | `usr-synth-cr-060` | ★ 4.8 |
| 63 | **Kira Sutherland** | `@kira_sutherland_30` | `VERIFIED_PRO` | `LIMITED` | `cr-synth-030` | `usr-synth-cr-030` | ★ 4.8 |
| 64 | **Kira Valenti** | `@kira_valenti_80` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-080` | `usr-synth-cr-080` | ★ 4.7 |
| 65 | **Leila Davenport** | `@leila_davenport_63` | `TOP_STUDIO` | `BOOKED` | `cr-synth-063` | `usr-synth-cr-063` | ★ 4.8 |
| 66 | **Leila Nakamura** | `@leila_nakamura_13` | `COMMUNITY` | `AVAILABLE` | `cr-synth-013` | `usr-synth-cr-013` | ★ 4.8 |
| 67 | **Leo Solano** | `@leo_solano_58` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-058` | `usr-synth-cr-058` | ★ 4.7 |
| 68 | **Leo Vargas** | `@leo_vargas_08` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-008` | `usr-synth-cr-008` | ★ 5.0 |
| 69 | **Liam O'Brien** | `@liam_games` | `VERIFIED_PRO` | `AVAILABLE` | `creator-liam-obrien` | `user-creator-11` | ★ 4.9 |
| 70 | **Lucian Ashford** | `@lucian_ashford_37` | `COMMUNITY` | `AVAILABLE` | `cr-synth-037` | `usr-synth-cr-037` | ★ 4.7 |
| 71 | **Lucian Sterling** | `@lucian_sterling_87` | `COMMUNITY` | `BOOKED` | `cr-synth-087` | `usr-synth-cr-087` | ★ 4.9 |
| 72 | **Lyra Solano** | `@lyra_solano_90` | `VERIFIED_PRO` | `LIMITED` | `cr-synth-090` | `usr-synth-cr-090` | ★ 4.9 |
| 73 | **Lyra Vargas** | `@lyra_vargas_40` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-040` | `usr-synth-cr-040` | ★ 4.8 |
| 74 | **Marcus Vance** | `@vance_3d` | `VERIFIED_PRO` | `AVAILABLE` | `creator-marcus-vance` | `user-creator-2` | ★ 4.9 |
| 75 | **Mateo Brandt** | `@mateo_brandt_54` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-054` | `usr-synth-cr-054` | ★ 4.8 |
| 76 | **Mateo Vargas** | `@mateo_vargas_104` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-104` | `usr-synth-cr-104` | ★ 4.9 |
| 77 | **Mateo Winter** | `@mateo_winter_04` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-004` | `usr-synth-cr-004` | ★ 5.0 |
| 78 | **Maya Holloway** | `@maya_holloway_18` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-018` | `usr-synth-cr-018` | ★ 4.9 |
| 79 | **Maya Lin** | `@mayalin_fashion` | `TOP_STUDIO` | `LIMITED` | `creator-maya-lin` | `user-creator-4` | ★ 5.0 |
| 80 | **Maya Winter** | `@maya_winter_68` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-068` | `usr-synth-cr-068` | ★ 4.8 |
| 81 | **Mira Hawthorne** | `@mira_hawthorne_15` | `COMMUNITY` | `LIMITED` | `cr-synth-015` | `usr-synth-cr-015` | ★ 4.9 |
| 82 | **Mira Vance** | `@mira_vance_65` | `COMMUNITY` | `AVAILABLE` | `cr-synth-065` | `usr-synth-cr-065` | ★ 4.8 |
| 83 | **Naia Chen** | `@naia_chen_38` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-038` | `usr-synth-cr-038` | ★ 4.9 |
| 84 | **Naia Lindqvist** | `@naia_lindqvist_88` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-088` | `usr-synth-cr-088` | ★ 4.7 |
| 85 | **Nico Mercer** | `@nico_mercer_12` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-012` | `usr-synth-cr-012` | ★ 4.8 |
| 86 | **Nico Sutherland** | `@nico_sutherland_62` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-062` | `usr-synth-cr-062` | ★ 4.9 |
| 87 | **Nora Lindqvist** | `@nora_minimal` | `UNVERIFIED` | `AVAILABLE` | `creator-nora-lindqvist` | `user-creator-14` | ★ 4.6 |
| 88 | **Priya Althaus** | `@priya_althaus_73` | `COMMUNITY` | `AVAILABLE` | `cr-synth-073` | `usr-synth-cr-073` | ★ 5.0 |
| 89 | **Priya Sterling** | `@priya_sterling_23` | `COMMUNITY` | `AVAILABLE` | `cr-synth-023` | `usr-synth-cr-023` | ★ 4.9 |
| 90 | **Reid Dubois** | `@reid_dubois_35` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-035` | `usr-synth-cr-035` | ★ 4.8 |
| 91 | **Reid Fairchild** | `@reid_fairchild_85` | `COMMUNITY` | `AVAILABLE` | `cr-synth-085` | `usr-synth-cr-085` | ★ 4.8 |
| 92 | **Remy Dubois** | `@remy_dubois_99` | `COMMUNITY` | `BOOKED` | `cr-synth-099` | `usr-synth-cr-099` | ★ 4.7 |
| 93 | **Remy Fontaine** | `@remy_fontaine_49` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-049` | `usr-synth-cr-049` | ★ 4.8 |
| 94 | **Rory Mercer** | `@rory_mercer_76` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-076` | `usr-synth-cr-076` | ★ 4.9 |
| 95 | **Rory Solano** | `@rory_solano_26` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-026` | `usr-synth-cr-026` | ★ 4.8 |
| 96 | **Rowan Dubois** | `@rowan_dubois_67` | `COMMUNITY` | `AVAILABLE` | `cr-synth-067` | `usr-synth-cr-067` | ★ 4.7 |
| 97 | **Rowan Fontaine** | `@rowan_fontaine_17` | `COMMUNITY` | `AVAILABLE` | `cr-synth-017` | `usr-synth-cr-017` | ★ 4.7 |
| 98 | **Selene Castillo** | `@selene_castillo_25` | `COMMUNITY` | `AVAILABLE` | `cr-synth-025` | `usr-synth-cr-025` | ★ 4.8 |
| 99 | **Selene Rousseau** | `@selene_rousseau_75` | `COMMUNITY` | `LIMITED` | `cr-synth-075` | `usr-synth-cr-075` | ★ 4.8 |
| 100 | **Shaik Arfa Anjum** | `@arfa` | `COMMUNITY` | `AVAILABLE` | `creator-4398746489` | `user-b679c828c17d` | ★ 5.0 |
| 101 | **Sienna Bergman** | `@sienna_bergman_103` | `COMMUNITY` | `AVAILABLE` | `cr-synth-103` | `usr-synth-cr-103` | ★ 5.0 |
| 102 | **Sienna Dubois** | `@sienna_dubois_03` | `COMMUNITY` | `BOOKED` | `cr-synth-003` | `usr-synth-cr-003` | ★ 4.8 |
| 103 | **Sienna Fairchild** | `@sienna_fairchild_53` | `COMMUNITY` | `AVAILABLE` | `cr-synth-053` | `usr-synth-cr-053` | ★ 5.0 |
| 104 | **Silas Novak** | `@silas_novak_83` | `COMMUNITY` | `AVAILABLE` | `cr-synth-083` | `usr-synth-cr-083` | ★ 4.8 |
| 105 | **Silas Vance** | `@silas_vance_33` | `COMMUNITY` | `BOOKED` | `cr-synth-033` | `usr-synth-cr-033` | ★ 4.8 |
| 106 | **Sophia Dubois** | `@sophia_beauty` | `VERIFIED_PRO` | `AVAILABLE` | `creator-sophia-dubois` | `user-creator-8` | ★ 5.0 |
| 107 | **Soren Ashford** | `@soren_ashford_69` | `COMMUNITY` | `BOOKED` | `cr-synth-069` | `usr-synth-cr-069` | ★ 4.7 |
| 108 | **Soren Novak** | `@soren_novak_19` | `COMMUNITY` | `AVAILABLE` | `cr-synth-019` | `usr-synth-cr-019` | ★ 5.0 |
| 109 | **Talia Chen** | `@talia_chen_70` | `TOP_STUDIO` | `AVAILABLE` | `cr-synth-070` | `usr-synth-cr-070` | ★ 4.9 |
| 110 | **Talia Kallio** | `@talia_kallio_20` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-020` | `usr-synth-cr-020` | ★ 4.9 |
| 111 | **Tariq Mansoor** | `@tariq_archviz` | `VERIFIED_PRO` | `AVAILABLE` | `creator-tariq-mansoor` | `user-creator-9` | ★ 4.9 |
| 112 | **Test User** | `@test_user_b896` | `COMMUNITY` | `AVAILABLE` | `cr-d5467747d71d` | `user-2fd5dcecd7c1` | ★ 5.0 |
| 113 | **Test User** | `@test_user_01ee` | `COMMUNITY` | `AVAILABLE` | `cr-7ca990cd1fc6` | `user-1bd80707d635` | ★ 5.0 |
| 114 | **Test User** | `@test_user_f1b5` | `COMMUNITY` | `AVAILABLE` | `cr-6bc00712776d` | `user-984615405132` | ★ 5.0 |
| 115 | **Test User** | `@test_user_77ee` | `COMMUNITY` | `AVAILABLE` | `cr-eb675c55a071` | `user-ad220e1e5469` | ★ 5.0 |
| 116 | **Test User** | `@test_user_e62e` | `COMMUNITY` | `AVAILABLE` | `cr-642bcb20a4a8` | `user-14fdd54b17cb` | ★ 5.0 |
| 117 | **Test User** | `@test_user_937d` | `COMMUNITY` | `AVAILABLE` | `cr-348f6866a9ec` | `user-ef5a58698772` | ★ 5.0 |
| 118 | **Test User** | `@test_user_d568` | `COMMUNITY` | `AVAILABLE` | `cr-9613e4ef7c8f` | `user-7d89b5b1d10f` | ★ 5.0 |
| 119 | **Tobias Davenport** | `@tobias_davenport_95` | `COMMUNITY` | `AVAILABLE` | `cr-synth-095` | `usr-synth-cr-095` | ★ 4.7 |
| 120 | **Tobias Nakamura** | `@tobias_nakamura_45` | `COMMUNITY` | `LIMITED` | `cr-synth-045` | `usr-synth-cr-045` | ★ 4.7 |
| 121 | **Vesper Brandt** | `@vesper_brandt_86` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-086` | `usr-synth-cr-086` | ★ 4.8 |
| 122 | **Vesper Winter** | `@vesper_winter_36` | `VERIFIED_PRO` | `BOOKED` | `cr-synth-036` | `usr-synth-cr-036` | ★ 4.8 |
| 123 | **Zara Althaus** | `@zara_althaus_105` | `TOP_STUDIO` | `LIMITED` | `cr-synth-105` | `usr-synth-cr-105` | ★ 4.9 |
| 124 | **Zara Ashford** | `@zara_ashford_05` | `COMMUNITY` | `AVAILABLE` | `cr-synth-005` | `usr-synth-cr-005` | ★ 4.7 |
| 125 | **Zara Chen** | `@zara_concept` | `COMMUNITY` | `AVAILABLE` | `creator-zara-chen` | `user-creator-6` | ★ 4.7 |
| 126 | **Zara Sterling** | `@zara_sterling_55` | `COMMUNITY` | `AVAILABLE` | `cr-synth-055` | `usr-synth-cr-055` | ★ 4.8 |
| 127 | **Zuri Mercer** | `@zuri_mercer_44` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-044` | `usr-synth-cr-044` | ★ 4.8 |
| 128 | **Zuri Sutherland** | `@zuri_sutherland_94` | `VERIFIED_PRO` | `AVAILABLE` | `cr-synth-094` | `usr-synth-cr-094` | ★ 4.9 |
| 129 | **test_05e367a2-ec53-4ad8-b60f-52c53b03d125** | `@test_05e367a2ec534ad_108d` | `COMMUNITY` | `AVAILABLE` | `cr-1d159e0704f0` | `user-cb9f8e98f6f8` | ★ 5.0 |
| 130 | **test_10adc1b3-38c6-468d-8b15-0e5a8f3afbd0** | `@test_10adc1b338c6468_087d` | `COMMUNITY` | `AVAILABLE` | `cr-e20713146fae` | `user-c624a7d990ea` | ★ 5.0 |
| 131 | **test_21e7cf39-edd3-46fa-8fc5-b8a25775abc4** | `@test_21e7cf39edd346f_3e13` | `COMMUNITY` | `AVAILABLE` | `cr-5e2c8e5fdb31` | `user-8cdd6710e16f` | ★ 5.0 |
| 132 | **test_2770f298-faaf-443d-922c-29be961241e3** | `@test_2770f298faaf443_b1ac` | `COMMUNITY` | `AVAILABLE` | `cr-0970877977ea` | `user-dfaff3face89` | ★ 5.0 |
| 133 | **test_2ccabe52-f3bc-45b7-a859-bad89b52933f** | `@test_2ccabe52f3bc45b_c6d4` | `COMMUNITY` | `AVAILABLE` | `cr-6571009147e3` | `user-765154196587` | ★ 5.0 |
| 134 | **test_4b526ff4-f0c3-4c0b-b782-ee7d20bc2131** | `@test_4b526ff4f0c34c0_27fb` | `COMMUNITY` | `AVAILABLE` | `cr-623102511ba9` | `user-67ecf22649cc` | ★ 5.0 |
| 135 | **test_4d33c618-59a7-463f-af60-08a1e217ca7a** | `@test_4d33c61859a7463_3e73` | `COMMUNITY` | `AVAILABLE` | `cr-d66f3fe074e0` | `user-5423e2493618` | ★ 5.0 |
| 136 | **test_57e461bf-6ef9-49ce-9cd3-3d7223a5f271** | `@test_57e461bf6ef949c_7dcf` | `COMMUNITY` | `AVAILABLE` | `cr-1b0e96efdc03` | `user-31530647ccc1` | ★ 5.0 |
| 137 | **test_6db5c475-b1d0-49b5-bea5-036932fa13ed** | `@test_6db5c475b1d049b_cbdc` | `COMMUNITY` | `AVAILABLE` | `cr-c9ca48c1d134` | `user-f754fbc469b4` | ★ 5.0 |
| 138 | **test_726610cf-a9a1-44e6-973d-d33bd5f30c30** | `@test_726610cfa9a144e_0176` | `COMMUNITY` | `AVAILABLE` | `cr-cc1d95e34e84` | `user-efb605318ee9` | ★ 5.0 |
| 139 | **test_757216f8-c0f1-4031-a7fd-2350489d8415** | `@test_757216f8c0f1403_986c` | `COMMUNITY` | `AVAILABLE` | `cr-fc616d692282` | `user-f7374e725897` | ★ 5.0 |
| 140 | **test_8287fe34-838a-482c-81dc-6aa15ce0c10a** | `@test_8287fe34838a482_a667` | `COMMUNITY` | `AVAILABLE` | `cr-aed83ecb6e59` | `user-97b0b08ad747` | ★ 5.0 |
| 141 | **test_8d1d8c1b-5a9f-4aa9-8a3a-a402b8034771** | `@test_8d1d8c1b5a9f4aa_aee4` | `COMMUNITY` | `AVAILABLE` | `cr-441d3ceb9b0a` | `user-6d00d7a1510c` | ★ 5.0 |
| 142 | **test_91192d91-fdf1-4ca5-a62e-8672c4edb01d** | `@test_91192d91fdf14ca_15ed` | `COMMUNITY` | `AVAILABLE` | `cr-0b2184af995a` | `user-52b83a0b20cb` | ★ 5.0 |
| 143 | **test_9255cb47-af93-4fb0-b151-189cfea64d6e** | `@test_9255cb47af934fb_7f64` | `COMMUNITY` | `AVAILABLE` | `cr-6464a8a4c941` | `user-a4c212d346c2` | ★ 5.0 |
| 144 | **test_96364a04-6384-4b37-bd76-493c1ac8b674** | `@test_96364a0463844b3_6ee4` | `COMMUNITY` | `AVAILABLE` | `cr-f408c184598b` | `user-ee80b8993e5f` | ★ 5.0 |
| 145 | **test_9dccfe04-37a2-4f18-aec4-d8612fba7d9c** | `@test_9dccfe0437a24f1_4ed3` | `COMMUNITY` | `AVAILABLE` | `cr-08f86b4638c1` | `user-356414608681` | ★ 5.0 |
| 146 | **test_a0a659ed-5429-459f-bcf9-c01a73151fd1** | `@test_a0a659ed5429459_591d` | `COMMUNITY` | `AVAILABLE` | `cr-fcc04a056fd6` | `user-4a51a102df50` | ★ 5.0 |
| 147 | **test_a1ca4f5a-ac0d-4df6-99ad-794404e7f8b2** | `@test_a1ca4f5aac0d4df_732a` | `COMMUNITY` | `AVAILABLE` | `cr-b3d2d28ec287` | `user-03db10c040b3` | ★ 5.0 |
| 148 | **test_b7a1bf10-3640-43cc-95d7-74fbd0bb8593** | `@test_b7a1bf10364043c_fab1` | `COMMUNITY` | `AVAILABLE` | `cr-5129b6155515` | `user-2c689663ee25` | ★ 5.0 |
| 149 | **test_ba4667dd-12ea-4c46-9a79-88a67e621206** | `@test_ba4667dd12ea4c4_b059` | `COMMUNITY` | `AVAILABLE` | `cr-6641088bf760` | `user-8e2dffbcbe6b` | ★ 5.0 |
| 150 | **test_bca4b6fa-67d9-4a03-b806-87709027aa29** | `@test_bca4b6fa67d94a0_762f` | `COMMUNITY` | `AVAILABLE` | `cr-543fa2cd06eb` | `user-117e0e97a422` | ★ 5.0 |
| 151 | **test_c542aa19-8dbc-4381-89b2-2a5be69fa8de** | `@test_c542aa198dbc438_cbcd` | `COMMUNITY` | `AVAILABLE` | `cr-e9be90a23881` | `user-0e722ff8b671` | ★ 5.0 |
| 152 | **test_d2d97634-ba8b-4112-b7fb-7cd38d2a03dc** | `@test_d2d97634ba8b411_87b8` | `COMMUNITY` | `AVAILABLE` | `cr-9efd75252cd1` | `user-f5ed95c60e61` | ★ 5.0 |
| 153 | **test_d6ac7aa3-4b9c-450c-98be-fc7a04a78218** | `@test_d6ac7aa34b9c450_56d7` | `COMMUNITY` | `AVAILABLE` | `cr-3a6bf2407e91` | `user-45151ed31631` | ★ 5.0 |
| 154 | **test_d8144515-9854-48ff-be75-b5353ff8bd2b** | `@test_d8144515985448f_c284` | `COMMUNITY` | `AVAILABLE` | `cr-73ede846f9eb` | `user-feba69725df5` | ★ 5.0 |
| 155 | **test_d83296ae-01de-4d0e-a59f-2a37a6a312df** | `@test_d83296ae01de4d0_7fe6` | `COMMUNITY` | `AVAILABLE` | `cr-6586225b2e37` | `user-47792ccbb7c2` | ★ 5.0 |
| 156 | **test_d8575844-49ee-4e3b-9cde-3714934f55ff** | `@test_d857584449ee4e3_5dbe` | `COMMUNITY` | `AVAILABLE` | `cr-55147f9a5f9f` | `user-948d0bc43bbb` | ★ 5.0 |
| 157 | **test_da784bca-90c3-4871-8f75-aba89c3a4f49** | `@test_da784bca90c3487_d57e` | `COMMUNITY` | `AVAILABLE` | `cr-1785d2cedb53` | `user-73221ae5fd46` | ★ 5.0 |
| 158 | **test_fbefa11c-210c-469e-83fe-9448a46dc6f8** | `@test_fbefa11c210c469_7402` | `COMMUNITY` | `AVAILABLE` | `cr-db4614a95e85` | `user-fb6101b62d14` | ★ 5.0 |

---

## 4. List of 61 Registered Creator Accounts Awaiting Profile Setup

| # | Name Status | User ID | Account Email | Email Verified | Created At |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | *Name not provided* | `user-a405d1f78337` | `elena.rostova@creator.kivora.dev` | ✓ Yes | 2026-10-10 00:07:03.308740 |
| 2 | *Name not provided* | `user-2ec3140ed55d` | `test_fetch@kivora.demo` | ✗ No | 2026-10-10 01:35:49.592196 |
| 3 | *Name not provided* | `user-161c0eb4797e` | `test_fetch2@kivora.demo` | ✗ No | 2026-10-10 01:36:07.092706 |
| 4 | *Name not provided* | `user-6263d6df9526` | `test_vite_proxy@kivora.demo` | ✗ No | 2026-10-10 01:37:30.292810 |
| 5 | *Name not provided* | `user-e47463090dcf` | `test_pydantic@kivora.demo` | ✗ No | 2026-10-10 01:37:58.062057 |
| 6 | *Name not provided* | `user-30b05903f7d5` | `test_3e22717d-e353-423c-b3d2-3fdadbdd4c70@example.com` | ✓ Yes | 2026-10-10 02:57:30.023997 |
| 7 | *Name not provided* | `user-57110f1aa175` | `test_29f0300d-c3a3-4260-9241-b28c370e600d@limit.com` | ✗ No | 2026-10-10 02:57:30.573133 |
| 8 | *Name not provided* | `user-b9e2f6f58f65` | `test_3e64fe0d-27c9-4d4c-84a9-3a8af81a9c9b@example.com` | ✓ Yes | 2026-10-10 03:04:19.164173 |
| 9 | *Name not provided* | `user-4e0e2a69f95b` | `test_8ef1767e-514f-41a9-a126-5163760a819c@limit.com` | ✗ No | 2026-10-10 03:04:19.730998 |
| 10 | *Name not provided* | `user-f50101de5633` | `test_8302842b-5dd3-45d0-be23-d55fab554721@example.com` | ✓ Yes | 2026-10-10 03:12:51.563670 |
| 11 | *Name not provided* | `user-593ad1033d9a` | `test_3a2409cc-b192-4e7c-8807-0650c8f5e7e1@limit.com` | ✗ No | 2026-10-10 03:12:52.121651 |
| 12 | *Name not provided* | `user-056701127197` | `test_0a9b58dd-277e-4486-8236-0a704234eb43@login.com` | ✓ Yes | 2026-10-10 03:13:50.412320 |
| 13 | *Name not provided* | `user-0af4bf41bfd0` | `test_6c70fea6-bccf-4c72-b530-a2d0b4d40cc4@unverified.com` | ✗ No | 2026-10-10 03:13:51.409192 |
| 14 | *Name not provided* | `user-728244980a3f` | `test_6db59ce0-d991-4e77-a399-101e53961036@dup.com` | ✗ No | 2026-10-10 03:13:52.370359 |
| 15 | *Name not provided* | `user-f58b1209eb1f` | `test_350a3ef3-b933-4c66-b0d6-a99c9091109c@resend.com` | ✗ No | 2026-10-10 03:13:52.873056 |
| 16 | *Name not provided* | `user-35fe110af1ca` | `test_6a27df5b-3628-460d-8aa6-fd9d12ce1f02@example.com` | ✓ Yes | 2026-10-10 03:13:53.378070 |
| 17 | *Name not provided* | `user-130b2710128b` | `test_38636ffd-ee86-41c3-b9da-85d667a0ad2d@limit.com` | ✗ No | 2026-10-10 03:13:53.905618 |
| 18 | *Name not provided* | `user-fa9b032e50fb` | `test_c36dd33d-14f0-4ac9-a4f2-88537c48bf21@login.com` | ✓ Yes | 2026-10-10 05:37:27.666920 |
| 19 | *Name not provided* | `user-165571318ea7` | `test_657ea0c1-3f21-4c13-928c-4fb4a63b1c7c@unverified.com` | ✗ No | 2026-10-10 05:37:28.825615 |
| 20 | *Name not provided* | `user-8b00ada375ba` | `test_9da0219f-7caf-4a40-978a-3fe678b7d7c0@dup.com` | ✗ No | 2026-10-10 05:37:29.861987 |
| 21 | *Name not provided* | `user-7355f5e7ac3b` | `test_eb85819e-e3b3-4490-ab06-df56db8372af@resend.com` | ✗ No | 2026-10-10 05:37:30.420771 |
| 22 | *Name not provided* | `user-12f17e9e8e76` | `test_384099c6-f655-4e4f-a0fd-cea9c7b7e9ac@example.com` | ✓ Yes | 2026-10-10 05:37:31.066447 |
| 23 | *Name not provided* | `user-16ad1cd43dc0` | `test_ef7cd0fc-d5ae-4f67-99a8-ed4a6831b47e@limit.com` | ✗ No | 2026-10-10 05:37:31.668591 |
| 24 | *Name not provided* | `user-21644dcb154b` | `test_c979296c-c8b5-4c6e-8279-70ef38d7b4dd@login.com` | ✓ Yes | 2026-10-10 05:38:02.925951 |
| 25 | *Name not provided* | `user-817d6ca99371` | `test_9080a71d-13a1-486d-9362-698712627ee5@unverified.com` | ✗ No | 2026-10-10 05:38:03.992270 |
| 26 | *Name not provided* | `user-000fffa16794` | `test_3fb5bd3c-ce90-47cc-9bd8-968a004cb47c@dup.com` | ✗ No | 2026-10-10 05:38:05.119285 |
| 27 | *Name not provided* | `user-9feebf989c53` | `test_67435578-b2ca-4aeb-a3b3-b8c3c2a1595f@resend.com` | ✗ No | 2026-10-10 05:38:05.783069 |
| 28 | *Name not provided* | `user-0db089a019f2` | `test_36ac1703-6036-49a8-a4af-2d068269f52b@example.com` | ✓ Yes | 2026-10-10 05:38:06.337065 |
| 29 | *Name not provided* | `user-5bfc8e072524` | `test_5d4b1a33-e427-4e5e-8bfd-f783be13fd71@limit.com` | ✗ No | 2026-10-10 05:38:06.939318 |
| 30 | *Name not provided* | `user-cb39b3d815f8` | `test_67f704b2-723a-44bc-9a93-0ff058b0da86@login.com` | ✓ Yes | 2026-10-10 05:38:51.972965 |
| 31 | *Name not provided* | `user-0a8ff83998e8` | `test_4efebe04-45a3-4ca9-993f-bbe825442c0e@unverified.com` | ✗ No | 2026-10-10 05:38:53.051986 |
| 32 | *Name not provided* | `user-df27bbc20939` | `test_70f825fe-b141-48b5-af56-4bd7cef101fb@dup.com` | ✗ No | 2026-10-10 05:38:54.093625 |
| 33 | *Name not provided* | `user-5a5ae3c06914` | `test_3e15098b-9b7b-4fe0-8b7f-8d59c7b9f139@resend.com` | ✗ No | 2026-10-10 05:38:54.635404 |
| 34 | *Name not provided* | `user-c4a14216cfaf` | `test_d0e25e7d-54c4-4986-b551-007e427e296f@example.com` | ✓ Yes | 2026-10-10 05:38:55.309919 |
| 35 | *Name not provided* | `user-e82ef34f878e` | `test_7e32b59e-bc08-4384-ba79-12127b3a099b@limit.com` | ✗ No | 2026-10-10 05:38:55.892241 |
| 36 | *Name not provided* | `user-319f3de33f48` | `test_596253ec-375f-4151-8aec-94d89b77ba0b@login.com` | ✓ Yes | 2026-10-10 05:40:53.859830 |
| 37 | *Name not provided* | `user-a68129a8e854` | `test_79cf8b79-5fa1-4fd0-b260-8f106516585e@unverified.com` | ✗ No | 2026-10-10 05:40:54.931361 |
| 38 | *Name not provided* | `user-61d5fd6ec841` | `test_3de834bd-585b-4cd3-a178-b09e62c67c2f@dup.com` | ✗ No | 2026-10-10 05:40:55.908879 |
| 39 | *Name not provided* | `user-dfd8ea7f3747` | `test_d9664425-b196-4fa0-ba14-726f9a1c9bce@resend.com` | ✗ No | 2026-10-10 05:40:56.458657 |
| 40 | *Name not provided* | `user-1fb281eb171d` | `test_da59c795-f532-4a64-a208-69946c8151bb@example.com` | ✓ Yes | 2026-10-10 05:40:57.029491 |
| 41 | *Name not provided* | `user-50a727f25dbf` | `test_0b5d9da6-0ec4-40bc-a9ae-cfddd1f3c66b@limit.com` | ✗ No | 2026-10-10 05:40:57.636554 |
| 42 | *Name not provided* | `user-e0cd1e1d6567` | `test_c74b1942-7ed5-49ae-9246-0c771401cba3@login.com` | ✓ Yes | 2026-10-10 06:17:04.834501 |
| 43 | *Name not provided* | `user-c3ca66271133` | `test_fceeda58-0c30-4e36-9213-e68e2739689d@unverified.com` | ✗ No | 2026-10-10 06:17:05.924239 |
| 44 | *Name not provided* | `user-f8ffc9d1f685` | `test_aba8a053-396e-45c6-a6eb-10853cbd0693@dup.com` | ✗ No | 2026-10-10 06:17:06.925148 |
| 45 | *Name not provided* | `user-53b6ee71686e` | `test_79bd4ee0-c5b3-436a-bc89-980d0c54ec9d@resend.com` | ✗ No | 2026-10-10 06:17:07.473317 |
| 46 | *Name not provided* | `user-ee0727671c81` | `test_a9f5dc45-2fa0-4b63-855d-1e46b33e46e6@example.com` | ✓ Yes | 2026-10-10 06:17:08.025148 |
| 47 | *Name not provided* | `user-c1e68baed208` | `test_50ce1826-89ea-4adc-8af5-49860a6770d6@limit.com` | ✗ No | 2026-10-10 06:17:08.685077 |
| 48 | *Name not provided* | `user-19afa2338d0f` | `test_70740842-8f82-4488-9e7b-b3361c4ba745@login.com` | ✓ Yes | 2026-10-10 06:17:56.803908 |
| 49 | *Name not provided* | `user-3ea22ec432a7` | `test_5556ab37-c245-4639-9a40-53bfe84af482@unverified.com` | ✗ No | 2026-10-10 06:17:57.948529 |
| 50 | *Name not provided* | `user-5ed68563c79d` | `test_b06854b5-f733-461e-a51b-b17e78ad2c10@dup.com` | ✗ No | 2026-10-10 06:17:58.977573 |
| 51 | *Name not provided* | `user-bb1a9732a884` | `test_07fbfb47-e3cb-445c-9db5-790d2a1226c2@resend.com` | ✗ No | 2026-10-10 06:17:59.534647 |
| 52 | *Name not provided* | `user-1509fbfb297f` | `test_b2599fe6-8a39-44ae-951c-dfddf9499073@example.com` | ✓ Yes | 2026-10-10 06:18:00.060644 |
| 53 | *Name not provided* | `user-66f5e4239b4d` | `test_f39de212-fbb1-4e44-b435-8772c0073435@limit.com` | ✗ No | 2026-10-10 06:18:00.624508 |
| 54 | *Name not provided* | `user-1fb838dc68b3` | `vu.241fa04931@gmail.com` | ✓ Yes | 2026-10-10 06:21:35.202587 |
| 55 | *Name not provided* | `user-3da60b53cc0c` | `vu.241fa04436@gmail.com` | ✓ Yes | 2026-10-10 06:32:56.293843 |
| 56 | *Name not provided* | `user-5dadaebfdee5` | `test_87159a09-2d82-41fb-98d3-186326f355a3@login.com` | ✓ Yes | 2026-10-10 06:36:16.163186 |
| 57 | *Name not provided* | `user-21e3396dc681` | `test_574e4989-ce0b-4b23-8be6-fa816a9aafcc@unverified.com` | ✗ No | 2026-10-10 06:36:17.293867 |
| 58 | *Name not provided* | `user-08f2bf1400ed` | `test_82dd531b-514c-4cbb-be54-a50adea77ebf@dup.com` | ✗ No | 2026-10-10 06:36:18.283823 |
| 59 | *Name not provided* | `user-025a6e2b9a98` | `test_6260cd15-d0aa-49e8-8362-7559f4305eda@resend.com` | ✗ No | 2026-10-10 06:36:18.823011 |
| 60 | *Name not provided* | `user-4917a12bbb4b` | `test_25fcd9d5-1a44-40ab-ad23-bd867c68c1a7@example.com` | ✓ Yes | 2026-10-10 06:36:19.386385 |
| 61 | *Name not provided* | `user-081206b8910f` | `test_778a8a12-0261-4c6a-ace0-40b6f9c366e7@limit.com` | ✗ No | 2026-10-10 06:36:19.975666 |

---

## 5. Export Verification & File Cross-Check

- **CSV Path:** [`exports/kivora_creators.csv`](../exports/kivora_creators.csv)
- **Total Rows in CSV:** `219` (158 creator profiles + 61 registered creator accounts awaiting profile setup)
- **Data Completeness:** 100% of database records exported without pagination truncation.
