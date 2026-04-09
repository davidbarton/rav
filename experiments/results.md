# Experiment Results

> Generated 2026-04-09 21:52 UTC

---

## 01_stratified_spend

```
|                    report                    |
|----------------------------------------------|
| === Experiment 1: Stratified Spend Model === |
|                     brand                     | ads | impressions | flat_low_eur | flat_high_eur | strat_low_eur | strat_high_eur | flat_range_width | strat_range_width | dominant_format |
|-----------------------------------------------|----:|------------:|-------------:|--------------:|--------------:|---------------:|-----------------:|------------------:|-----------------|
| Nike, Inc.                                    | 60  | 516493328   | 2065973.0    | 4648440.0     | 3019824.0     | 7151771.0      | 2582467.0        | 4131947.0         | dynamic         |
| Birkenstock Digital GmbH                      | 80  | 159961557   | 639846.0     | 1439654.0     | 982031.0      | 2261723.0      | 799808.0         | 1279692.0         | premium         |
| HUGO BOSS AG                                  | 512 | 110331091   | 441324.0     | 992980.0      | 910135.0      | 2420696.0      | 551655.0         | 1510561.0         | standard        |
| Cartier, Branch of Richemont International SA | 53  | 108191806   | 432767.0     | 973726.0      | 1102838.0     | 3003203.0      | 540959.0         | 1900365.0         | standard        |
| Zalando SE                                    | 79  | 93942169    | 375769.0     | 845480.0      | 696762.0      | 1902142.0      | 469711.0         | 1205380.0         | standard        |
| boohooMAN                                     | 40  | 88917761    | 355671.0     | 800260.0      | 606135.0      | 1317477.0      | 444589.0         | 711342.0          | premium         |
| Tommy Hilfiger Europe B.V.                    | 30  | 66548281    | 266193.0     | 598935.0      | 319516.0      | 851902.0       | 332741.0         | 532386.0          | standard        |
| Canada Goose                                  | 24  | 55980115    | 223920.0     | 503821.0      | 606841.0      | 1584574.0      | 279901.0         | 977732.0          | standard        |
| Dr. Martens                                   | 27  | 51584280    | 206337.0     | 464259.0      | 342869.0      | 755543.0       | 257921.0         | 412674.0          | standard        |
| CHANEL                                        | 82  | 49378313    | 197513.0     | 444405.0      | 500562.0      | 1320452.0      | 246892.0         | 819890.0          | standard        |
| Pandora A/S                                   | 49  | 48168205    | 192673.0     | 433514.0      | 283958.0      | 805212.0       | 240841.0         | 521255.0          | standard        |
| Dior                                          | 65  | 47915398    | 191662.0     | 431239.0      | 326942.0      | 780443.0       | 239577.0         | 453501.0          | standard        |
| Guccio Gucci S.p.A.                           | 7   | 47895876    | 191584.0     | 431063.0      | 354512.0      | 984408.0       | 239479.0         | 629896.0          | ar_lens         |
| COTY GLOBAL ORGANIZATION managed by Publicis  | 54  | 36732567    | 146930.0     | 330593.0      | 387572.0      | 1048934.0      | 183663.0         | 661361.0          | standard        |
| Jordan                                        | 60  | 34822561    | 139290.0     | 313403.0      | 139290.0      | 417871.0       | 174113.0         | 278580.0          | standard        |
| adidas AG                                     | 90  | 34717817    | 138871.0     | 312460.0      | 358710.0      | 975145.0       | 173589.0         | 616434.0          | standard        |
| Stillfront Supremacy GmbH                     | 97  | 34520591    | 138082.0     | 310685.0      | 138082.0      | 414247.0       | 172603.0         | 276165.0          | standard        |
| CELINE                                        | 10  | 31942438    | 127770.0     | 287482.0      | 155881.0      | 411421.0       | 159712.0         | 255540.0          | standard        |
| Essence Digital Limited                       | 22  | 30905587    | 123622.0     | 278150.0      | 123622.0      | 370867.0       | 154528.0         | 247245.0          | standard        |
| SHEINADS                                      | 59  | 29210719    | 116843.0     | 262896.0      | 149045.0      | 382731.0       | 146054.0         | 233686.0          | standard        |
```

---

## 02_political_cpm_validation

```
|                       report                       |
|----------------------------------------------------|
| === Experiment 2: Political Ads CPM Validation === |
|    segment     |  ads  | total_spend | p10_cpm | p25_cpm | median_cpm | p75_cpm | p90_cpm |
|----------------|------:|------------:|--------:|--------:|-----------:|--------:|--------:|
| all_currencies | 72979 | 117509216.0 | 2.07    | 3.91    | 7.76       | 15.33   | 28.14   |
| EUR_only       | 4588  | 4289408.0   | 0.92    | 1.36    | 2.43       | 4.3     | 6.88    |
| USD_only       | 57043 | 79730940.0  | 2.5     | 4.48    | 8.21       | 14.93   | 24.59   |
| GBP_only       | 3557  | 2030206.0   | 0.86    | 1.77    | 2.96       | 6.0     | 8.96    |
|                                report                                |
|----------------------------------------------------------------------|
| --- What fraction of political ads have CPM in our 4-9 EUR band? --- |
| total | in_band | pct_in_band | below_band | pct_below | above_band | pct_above |
|------:|--------:|------------:|-----------:|----------:|-----------:|----------:|
| 4588  | 1038    | 22.6        | 3308       | 72.1      | 242        | 5.3       |
```

---

## 03_share_of_voice_stability

```
|                     report                     |
|------------------------------------------------|
| === Experiment 3: Share of Voice Stability === |
|                     brand                     | total_ads | countries | avg_impressions | median_impressions | max_impressions | min_impressions | top_ad_pct | total_impressions |
|-----------------------------------------------|----------:|----------:|----------------:|-------------------:|----------------:|----------------:|-----------:|------------------:|
| Nike, Inc.                                    | 60        | 7         | 8608222.0       | 1404933.0          | 82890546        | 3583            | 16.0       | 516493328         |
| Birkenstock Digital GmbH                      | 80        | 8         | 1999519.0       | 379324.0           | 32618786        | 450             | 20.4       | 159961557         |
| HUGO BOSS AG                                  | 512       | 10        | 215490.0        | 35225.0            | 9863427         | 1               | 8.9        | 110331091         |
| Cartier, Branch of Richemont International SA | 53        | 6         | 2041355.0       | 822952.0           | 17012016        | 1142            | 15.7       | 108191806         |
| Zalando SE                                    | 79        | 11        | 1189141.0       | 465778.0           | 17299560        | 26              | 18.4       | 93942169          |
| boohooMAN                                     | 40        | 4         | 2222944.0       | 467468.0           | 26281425        | 31875           | 29.6       | 88917761          |
| Tommy Hilfiger Europe B.V.                    | 30        | 3         | 2218276.0       | 1197307.0          | 6424813         | 225659          | 9.7        | 66548281          |
| Canada Goose                                  | 24        | 2         | 2332505.0       | 347607.0           | 20148585        | 37              | 36.0       | 55980115          |
| Dr. Martens                                   | 27        | 4         | 1910529.0       | 126247.0           | 12343402        | 13565           | 23.9       | 51584280          |
| CHANEL                                        | 82        | 11        | 602175.0        | 198923.0           | 6376375         | 736             | 12.9       | 49378313          |
| Pandora A/S                                   | 49        | 5         | 983025.0        | 343254.0           | 9249716         | 13339           | 19.2       | 48168205          |
| Dior                                          | 65        | 8         | 737160.0        | 161807.0           | 10495577        | 803             | 21.9       | 47915398          |
| Guccio Gucci S.p.A.                           | 7         | 1         | 6842268.0       | 3279606.0          | 30017267        | 85512           | 62.7       | 47895876          |
| COTY GLOBAL ORGANIZATION managed by Publicis  | 54        | 6         | 680233.0        | 168233.0           | 9947655         | 9352            | 27.1       | 36732567          |
| Jordan                                        | 60        | 12        | 580376.0        | 6568.0             | 3375651         | 12              | 9.7        | 34822561          |
| adidas AG                                     | 90        | 9         | 385754.0        | 16812.0            | 13993408        | 6               | 40.3       | 34717817          |
| Stillfront Supremacy GmbH                     | 97        | 12        | 355882.0        | 44441.0            | 3541449         | 5553            | 10.3       | 34520591          |
| CELINE                                        | 10        | 1         | 3194244.0       | 1670599.0          | 10590709        | 336445          | 33.2       | 31942438          |
| Essence Digital Limited                       | 22        | 3         | 1404799.0       | 560933.0           | 11418626        | 82693           | 36.9       | 30905587          |
| SHEINADS                                      | 59        | 6         | 495097.0        | 13865.0            | 19635471        | 33              | 67.2       | 29210719          |
|                          report                          |
|----------------------------------------------------------|
| --- Ranking comparison: Overall vs France vs Germany --- |
|                     brand                     | rank_overall | impressions_all | rank_fr | impressions_fr | rank_de | impressions_de |
|-----------------------------------------------|-------------:|----------------:|--------:|---------------:|--------:|---------------:|
| Nike, Inc.                                    | 1            | 516493328       | 1       | 252508628      | 2       | 58428201       |
| Birkenstock Digital GmbH                      | 2            | 159961557       | 3       | 64749876       | 6       | 15260259       |
| HUGO BOSS AG                                  | 3            | 110331091       | 12      | 20965434       | 1       | 81072401       |
| Cartier, Branch of Richemont International SA | 4            | 108191806       | 8       | 30317242       | 3       | 38817193       |
| Zalando SE                                    | 5            | 93942169        | 30      | 7091482        | 22      | 1480052        |
| boohooMAN                                     | 6            | 88917761        | 2       | 66866851       | 14      | 5257004        |
| Tommy Hilfiger Europe B.V.                    | 7            | 66548281        | 6       | 40009715       | 5       | 19071160       |
| Canada Goose                                  | 8            | 55980115        | 9       | 25496772       | 4       | 30483343       |
| Dr. Martens                                   | 9            | 51584280        | 4       | 49746316       | 28      | 261504         |
| CHANEL                                        | 10           | 49378313        | 15      | 16390669       | 9       | 11768974       |
| Pandora A/S                                   | 11           | 48168205        | 13      | 20891565       | 17      | 3215583        |
| Dior                                          | 12           | 47915398        | 34      | 5175860        | 8       | 13234291       |
| Guccio Gucci S.p.A.                           | 13           | 47895876        | 5       | 47895876       | NULL    | NULL           |
| COTY GLOBAL ORGANIZATION managed by Publicis  | 14           | 36732567        | 20      | 13065609       | 7       | 15124476       |
| Jordan                                        | 15           | 34822561        | 58      | 358072         | 15      | 3386122        |
```

---

## 04_sponsor_advertiser_overlap

```
|                      report                      |
|--------------------------------------------------|
| === Experiment 4: Sponsor-Advertiser Overlap === |
| distinct_paid_advertisers |
|--------------------------:|
| 402                       |
| distinct_named_sponsors |
|------------------------:|
| 3039                    |
|                                 report                                  |
|-------------------------------------------------------------------------|
| --- Paid advertisers that also appear as sponsors (substring match) --- |
|             paid_brand              |         sponsor_match          | paid_ads | paid_impressions | sponsored_creators | content_pieces |
|-------------------------------------|--------------------------------|---------:|-----------------:|-------------------:|---------------:|
| Dior                                | Diordie                        | 65       | 47915398         | 1                  | 1              |
| Essence Digital Limited             | GHANA ESSENCE🇬🇭!                | 22       | 30905587         | 1                  | 1              |
| Essence Digital Limited             | ESSENCE PERFUME                | 22       | 30905587         | 1                  | 1              |
| Under Armour                        | underwear essentials by queen  | 30       | 19062545         | 1                  | 1              |
| Givenchy Beauty                     | Givenchy Beauty                | 8        | 15143443         | 1                  | 2              |
| Essence Global (Universal Pictures) | GHANA ESSENCE🇬🇭!                | 16       | 12304675         | 1                  | 1              |
| Essence Global (Universal Pictures) | ESSENCE PERFUME                | 16       | 12304675         | 1                  | 1              |
| Tiffany & Co.                       | tiffany😘🤘                    | 7        | 11777138         | 1                  | 3              |
| Foot Locker                         | Live Football                  | 30       | 11773825         | 1                  | 1              |
| Foot Locker                         | big_footballx                  | 30       | 11773825         | 1                  | 1              |
| Foot Locker                         | CM7foot85                      | 30       | 11773825         | 1                  | 1              |
| Foot Locker                         | Compte Foot                    | 30       | 11773825         | 1                  | 1              |
| Blue Mango Interactive B.V.         | Unity Blueprint With Maz       | 20       | 7293036          | 1                  | 1              |
| Blue Mango Interactive B.V.         | Blue Diamond                   | 20       | 7293036          | 1                  | 2              |
| Blue Mango Interactive B.V.         | Blue_moon                      | 20       | 7293036          | 1                  | 1              |
| Marketing CoOp DK A/S               | Muzn Marketing                 | 6        | 7159775          | 1                  | 2              |
| GLOBAL New Balance                  | Global Blog 🌍                 | 20       | 3820332          | 1                  | 5              |
| GLOBAL New Balance                  | Global Poker                   | 20       | 3820332          | 1                  | 1              |
| Market D LLC                        | Muzn Marketing                 | 16       | 1644051          | 1                  | 2              |
| Luca da Palma Ferramacho            | 💜MR LUCAS💜🕊                  | 13       | 793375           | 1                  | 1              |
| Full Spice Digital Marketing        | afghanisaifulla                | 41       | 726654           | 1                  | 1              |
| Coach Manal Abdulaziz               | Coach Nada Aljuhani            | 72       | 466988           | 1                  | 1              |
| Dior Ndiaye👸                       | Diordie                        | 5        | 356015           | 1                  | 1              |
| Enjoy Tacos                         | enjoychori                     | 2        | 209232           | 1                  | 1              |
| BLACK ONYX UG (haftungsbeschränkt)  | the black wizard               | 9        | 185915           | 1                  | 1              |
| BLACK ONYX UG (haftungsbeschränkt)  | BlackTech \| Apple Authorized‏ | 9        | 185915           | 1                  | 4              |
| BLACK ONYX UG (haftungsbeschränkt)  | BLACK KNIGHT                   | 9        | 185915           | 1                  | 1              |
| BLACK ONYX UG (haftungsbeschränkt)  | black_queen124                 | 9        | 185915           | 2                  | 3              |
| BLACK ONYX UG (haftungsbeschränkt)  | بلاك بيرد الاحساء Black Bird   | 9        | 185915           | 1                  | 7              |
| Coach J.J.                          | Coach Nada Aljuhani            | 21       | 73152            | 1                  | 1              |
| Safe Digital Marketing              | Safeyakhan                     | 6        | 65194            | 1                  | 1              |
| Coach Nour Aldraihem 💪🏼📊           | Coach Nada Aljuhani            | 2        | 42282            | 1                  | 1              |
| Kevin Evans Professional Services   | kevinharte                     | 2        | 26983            | 1                  | 1              |
| Tiffany Luxury Oran                 | tiffany😘🤘                    | 3        | 25924            | 1                  | 3              |
| Coach Qaisar🇧🇭                       | Coach Nada Aljuhani            | 4        | 22912            | 1                  | 1              |
| Lady Hermes                         | Lady Sylla                     | 3        | 20412            | 1                  | 1              |
| Lady Hermes                         | firstladyjolly                 | 3        | 20412            | 1                  | 1              |
| Slime Gucci                         | Big Slime 👑⚜️                  | 2        | 20242            | 1                  | 6              |
| Essence Aura Psychic                | GHANA ESSENCE🇬🇭!                | 7        | 15519            | 1                  | 1              |
| Essence Aura Psychic                | ESSENCE PERFUME                | 7        | 15519            | 1                  | 1              |
| ADAM GAINS COACHING 💪              | SaDaM CaDe                     | 5        | 14209            | 1                  | 1              |
| Coach Keskin                        | Coach Nada Aljuhani            | 4        | 14168            | 1                  | 1              |
| COCO CROCS 🌺🐳🌴🪸🐠🌟             | Coco                           | 1        | 11489            | 1                  | 9              |
| COCO CROCS 🌺🐳🌴🪸🐠🌟             | COCO 🥥                        | 1        | 11489            | 1                  | 39             |
| Anna Einarsdóttir                   | Hemant khanna                  | 5        | 11226            | 1                  | 6              |
| Anna Einarsdóttir                   | muhannadhamdan                 | 5        | 11226            | 1                  | 1              |
| Anna Einarsdóttir                   | waytojannahh_1                 | 5        | 11226            | 1                  | 5              |
| Anna Einarsdóttir                   | مهند عدنان \| Muhannad Adnan   | 5        | 11226            | 1                  | 1              |
| Anna Einarsdóttir                   | RUTUBHA_BANNA                  | 5        | 11226            | 1                  | 1              |
| Anna Einarsdóttir                   | Way to Jannah 🌸               | 5        | 11226            | 1                  | 2              |
| Maison Diorama                      | Maison Dahlawi                 | 4        | 10714            | 1                  | 1              |
| Tiffany 06                          | tiffany😘🤘                    | 1        | 10190            | 1                  | 3              |
| Travel - Affiliate Marketer         | AALIF TRAVELS                  | 6        | 6873             | 1                  | 8              |
| Travel - Affiliate Marketer         | SMOOTH TRAVEL                  | 6        | 6873             | 1                  | 1              |
| Travel - Affiliate Marketer         | BISAN_TRAVEL ✈️                 | 6        | 6873             | 3                  | 144            |
| Coach Bobo                          | Coach Nada Aljuhani            | 1        | 5269             | 1                  | 1              |
| Coach Beton                         | Coach Nada Aljuhani            | 1        | 4939             | 1                  | 1              |
| Coach Hasan                         | Coach Nada Aljuhani            | 1        | 4494             | 1                  | 1              |
| Maria Cucci Versace                 | Mariah 📸💡                    | 1        | 3886             | 1                  | 6              |
| Maria Cucci Versace                 | maria mercedes                 | 1        | 3886             | 1                  | 4              |
| Mila Zara                           | Oluwafunmilayo                 | 1        | 3881             | 1                  | 3              |
| Givenchy Shop Only Real             | Givenchy Beauty                | 1        | 3736             | 1                  | 2              |
| Custom TesCrocs                     | Customize with Mickey          | 1        | 3619             | 1                  | 1              |
| Essence de luxe                     | GHANA ESSENCE🇬🇭!                | 1        | 3247             | 1                  | 1              |
| Essence de luxe                     | ESSENCE PERFUME                | 1        | 3247             | 1                  | 1              |
| ESSENCE PRIVÉE                      | GHANA ESSENCE🇬🇭!                | 1        | 2243             | 1                  | 1              |
| ESSENCE PRIVÉE                      | ESSENCE PERFUME                | 1        | 2243             | 1                  | 1              |
| Temu Europe                         | ShopTemu                       | 1        | 1733             | 8                  | 16             |
| Temu Europe                         | TEMU_NL                        | 1        | 1733             | 1                  | 1              |
| Temu Europe                         | TEMU UK                        | 1        | 1733             | 1                  | 56             |
| Temu Europe                         | temu_arabia                    | 1        | 1733             | 10                 | 10             |
| Temu Europe                         | TEMU_FR                        | 1        | 1733             | 13                 | 19             |
| Lena Coaching \| Girls Only         | Selena 🤍✨                    | 1        | 1670             | 1                  | 1              |
| Lena Coaching \| Girls Only         | lenaBalloons                   | 1        | 1670             | 1                  | 1              |
| Essence Makers                      | ESSENCE PERFUME                | 1        | 732              | 1                  | 1              |
| Essence Makers                      | GHANA ESSENCE🇬🇭!                | 1        | 732              | 1                  | 1              |
| Tina Jordan                         | nitinahir22                    | 2        | 704              | 1                  | 1              |
| Gucci Lover                         | PRESIDENT TAYLOR GUCCI         | 4        | 704              | 1                  | 1              |
| Tiffany Bleu                        | tiffany😘🤘                    | 2        | 404              | 1                  | 3              |
| Dior 🇧🇷                              | Diordie                        | 3        | 267              | 1                  | 1              |
| London Costen                       | Karim London 🙉                | 1        | 64               | 1                  | 16             |
| COACH MAYS 🕊️🌿                      | Coach Nada Aljuhani            | 1        | 1                | 1                  | 1              |
|                         report                          |
|---------------------------------------------------------|
| --- Top paid brands with NO sponsored content match --- |
|                     brand                     | ads | impressions | presence  |
|-----------------------------------------------|----:|------------:|-----------|
| Nike, Inc.                                    | 60  | 516493328   | paid_only |
| Birkenstock Digital GmbH                      | 80  | 159961557   | paid_only |
| HUGO BOSS AG                                  | 512 | 110331091   | paid_only |
| Cartier, Branch of Richemont International SA | 53  | 108191806   | paid_only |
| Zalando SE                                    | 79  | 93942169    | paid_only |
| boohooMAN                                     | 40  | 88917761    | paid_only |
| Tommy Hilfiger Europe B.V.                    | 30  | 66548281    | paid_only |
| Canada Goose                                  | 24  | 55980115    | paid_only |
| Dr. Martens                                   | 27  | 51584280    | paid_only |
| CHANEL                                        | 82  | 49378313    | paid_only |
| Pandora A/S                                   | 49  | 48168205    | paid_only |
| Guccio Gucci S.p.A.                           | 7   | 47895876    | paid_only |
| COTY GLOBAL ORGANIZATION managed by Publicis  | 54  | 36732567    | paid_only |
| Jordan                                        | 60  | 34822561    | paid_only |
| adidas AG                                     | 90  | 34717817    | paid_only |
```

---

## 05_geographic_impressions_map

```
|                         report                         |
|--------------------------------------------------------|
| === Experiment 5: Geographic Impressions Map Check === |
| ad_id | paying_advertiser_name | query_country | impressions_total | map_countries |
|-------|------------------------|---------------|------------------:|---------------|
|                            report                            |
|--------------------------------------------------------------|
| --- Impressions map sum vs impressions_total consistency --- |
| ads_checked | has_map_data | avg_pct_diff | min_pct_diff | max_pct_diff |
|------------:|-------------:|-------------:|-------------:|-------------:|
| 100         | 100          | 0.0          | 0.0          | 0.0          |
|                    report                     |
|-----------------------------------------------|
| --- Distinct countries in impressions_map --- |
| distinct_countries |
|-------------------:|
| 28                 |
```

---

## 06_influencer_network

```
|                      report                       |
|---------------------------------------------------|
| === Experiment 6: Influencer Network Analysis === |
|                       report                        |
|-----------------------------------------------------|
| --- Top sponsors by unique creator partnerships --- |
|        sponsor_name         | creators | content_pieces | formats |
|-----------------------------|---------:|---------------:|--------:|
| dreams store                | 31       | 374            | 2       |
| مجموعة عاجي لطب الاسنان     | 31       | 180            | 2       |
| فرافلو                      | 29       | 458            | 2       |
| الماجد للعود                | 27       | 189            | 1       |
| Segadty \| سجادتي           | 25       | 177            | 2       |
| عمل خيري                    | 22       | 207            | 2       |
| فانير                       | 21       | 249            | 2       |
| Meras                       | 21       | 51             | 2       |
| Trendyol                    | 18       | 132            | 2       |
| اورسـلا كـيـر \| URSLA CARE | 17       | 92             | 2       |
| Gissah                      | 16       | 178            | 2       |
| Roxa \| روكسا               | 13       | 102            | 2       |
| TEMU_FR                     | 13       | 19             | 1       |
| Clean Life \| كلين لايف     | 11       | 83             | 2       |
| smataxi                     | 11       | 42             | 2       |
|                  report                  |
|------------------------------------------|
| --- Most active multi-brand creators --- |
|  creator_name   | brands_worked_with | total_pieces |                                                                                                                        brand_list                                                                                                                         |
|-----------------|-------------------:|-------------:|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| shadw_2         | 14                 | 147          | [Clean Life \| كلين لايف, Licho ليشو, SAVIOR, Sidra Style, Zuhrfragrance, lilyksa12, ovhrys store, اورسـلا كـيـر \| URSLA CARE, اوفريس للعطور, جرعة حب🩷, جمعية أبناؤنا لرعاية الأيتام, جمعية البر الخيرية بغميقة, جمعية عمار المساجد, جمعية مناهل الجود] |
| pixou74         | 13                 | 299          | [Anis TeamNasDAS⭐️🦅, CAMÉLIA 92 💕, COCACHERY🍒, Chikanoos Team Nasdas ❄️🦅, DONNA 🫦, Henna et Anis 🩷, KEMYS⭐️, Karim London 🙉, 'L\'ENFER 🦅☠️', Lyna 🌸🦅, MOUMLAME LA TCHATCHA 🕺🤪, Morgane💕, OVSIE ❤️🌴]                                            |
| yrr0li          | 10                 | 477          | [اعلان .., خبر الديوان الملكي🚨, خبر الديوان الملكي🚨!, خبر عاجل الان ★, ساره وجدتها🦅.•, 'سمر وجدتها 💛✨""', عاجل الان, عاجل الان🚨, وصفات سنعات🔥, وصفات لذيذة ورمضانية❤️🍴]                                                                            |
| mounerh.a       | 9                  | 109          | [ARTMISS, 'NOUVONA اكبر موقع عطور عالمية ', VIPKid في اي بي كيد - السعودية, dreams store, أرياف ألما, جمعية إسعاد, عمل خيري, فاغية العود, نايس ون]                                                                                                        |
| estqama         | 8                  | 56           | [اخبار انتبه 🇰🇼, الغمندة ‏🇰🇼, الكويت لايف 🇰🇼, ام علوم 🇰🇼, بصمه \| BA9MA 🇰🇼, فاشينستا الكويت, مستر عاجل, نقد سناب 📖]                                                                                                                                            |
| we.sisters      | 7                  | 108          | [Relin Perfume, SKORA, Segadty \| سجادتي, الجود, ركن الجمال, عبق التعلم, فانير]                                                                                                                                                                           |
| nadsh_5         | 6                  | 39           | [AN Skin Care, Clara, CozmaZone, Perfecto, بلانكو - Blanco, متجر فيرلي]                                                                                                                                                                                   |
| umazizandsalman | 6                  | 31           | [BANVIRA, Segadty \| سجادتي, SuLinda, dreams store, بلانكو - Blanco, روابط]                                                                                                                                                                               |
| mmagdy237       | 6                  | 17           | [ALMARAA \| المرعى, Chezzz, Cute Night, Gheem, Self \| سيلف, مفارش الحبيب]                                                                                                                                                                                |
| alnarjas_ksa    | 6                  | 15           | [Kids.touch📚🤍, SPACE JOY, جمعية تمكين شبابية, حاضرين, شركة سلة السكاكر فرع النرجس, فزعة]                                                                                                                                                                |
|                  report                  |
|------------------------------------------|
| --- Creator exclusivity distribution --- |
| sponsors_bucket | creators | pct  |
|-----------------|---------:|-----:|
| 1 (exclusive)   | 3137     | 91.9 |
| 2               | 184      | 5.4  |
| 3-5             | 84       | 2.5  |
| 6+              | 10       | 0.3  |
|                    report                    |
|----------------------------------------------|
| --- Sponsored content volume per creator --- |
| volume_bucket | creators | total_content |
|---------------|---------:|--------------:|
| 1 piece       | 1863     | 1863          |
| 2-5 pieces    | 823      | 2445          |
| 6-20 pieces   | 508      | 5600          |
| 21-50 pieces  | 206      | 6641          |
| 50+ pieces    | 84       | 9991          |
```

---

## 07_creator_discovery

```
|                     report                      |
|-------------------------------------------------|
| === Experiment 7: Creator Discovery & Reach === |
|                    report                    |
|----------------------------------------------|
| --- Sponsored creators with profile data --- |
| sponsored_creators_total | also_in_explore | also_in_brand_profiles |
|-------------------------:|----------------:|-----------------------:|
| 61761                    | 2               | 0                      |
|                        report                        |
|------------------------------------------------------|
| --- Creator subscriber tiers (explore discovery) --- |
|      tier       | creators | avg_subscribers | max_subscribers |
|-----------------|---------:|----------------:|----------------:|
| mega (1M+)      | 3        | 3671299.0       | 4731117         |
| macro (100K-1M) | 19       | 268086.0        | 742592          |
| mid (10K-100K)  | 46       | 36658.0         | 81025           |
| micro (1K-10K)  | 22       | 5464.0          | 9233            |
| nano (<1K)      | 12       | 195.0           | 687             |
|                report                 |
|---------------------------------------|
| --- Spotlight engagement by topic --- |
|     keyword     | videos | creators | total_views | avg_views | total_shares |
|-----------------|-------:|---------:|------------:|----------:|-------------:|
| fashion         | 24     | 22       | 10112627    | 421359.0  | 20310        |
| style           | 18     | 18       | 8517832     | 473213.0  | 127503       |
| wardrobe        | 18     | 18       | 4392335     | 244019.0  | 10944        |
| trendy          | 24     | 22       | 4025775     | 167741.0  | 26211        |
| outfit          | 24     | 24       | 3714542     | 154773.0  | 12861        |
| fashionblogger  | 18     | 13       | 2129263     | 118292.0  | 98447        |
| streetwear      | 24     | 19       | 1897648     | 79069.0   | 14065        |
| runway          | 21     | 18       | 1303128     | 62054.0   | 2894         |
| ootd            | 23     | 23       | 1179218     | 51270.0   | 6048         |
| fashion_style   | 13     | 12       | 1163158     | 89474.0   | 3657         |
| outfitoftheday  | 21     | 12       | 572632      | 27268.0   | 1137         |
| vintage_fashion | 4      | 4        | 298896      | 74724.0   | 5325         |
| fashion_week    | 2      | 2        | 34008       | 17004.0   | 91           |
|                report                 |
|---------------------------------------|
| --- Brands with Spotlight content --- |
|      brand       |    username     | spotlight_count | subscriber_count |
|------------------|-----------------|----------------:|-----------------:|
| Crocs            | crocs           | 21              | 11200            |
| Clarins          | clarinsofficial | 18              | 0                |
| Gymshark         | gymshark        | 17              | 0                |
| Balenciaga       | balenciaga      | 16              | 52800            |
| Carolina Herrera | carolinaherrera | 16              | 0                |
| Cartier          | cartierofficial | 16              | 0                |
| Dior             | dior            | 16              | 0                |
| Jimmy Choo       | jimmychoo       | 16              | 11700            |
| Louis Vuitton    | louisvuitton    | 16              | 0                |
| Michael Kors     | michaelkors     | 16              | 0                |
| Moncler          | moncler         | 16              | 0                |
| Omega            | omegaofficial   | 16              | 0                |
| Prada            | prada           | 16              | 52500            |
| Shein            | sheinofficial   | 16              | 491500           |
| Timberland       | timberland      | 16              | 0                |
| Gucci            | gucci           | 15              | 0                |
| Zara             | zaraofficial    | 12              | 0                |
| H&M              | h_m             | 10              | 0                |
| Nike             | nike            | 9               | 0                |
| Miu Miu          | miumiu_official | 7               | 0                |
```

---

## 08_influencer_enrichment_potential

```
|                        report                         |
|-------------------------------------------------------|
| === Experiment 8: Influencer Enrichment Potential === |
|                   report                   |
|--------------------------------------------|
| --- Current data per sponsored creator --- |
|                     fields_available                     |                          fields_missing                          | creators_affected | content_pieces |
|----------------------------------------------------------|------------------------------------------------------------------|------------------:|---------------:|
| sponsor_name + creator_name + content_url + content_type | view_count, follower_count, demographics, timestamps, engagement | 3415              | 26282          |
|                report                 |
|---------------------------------------|
| --- Cross-table overlap (current) --- |
|   source_table    | total_creators | matched_in_explore_profiles | matched_in_explore_spotlights | matched_in_spotlight_pages | matched_in_brand_profiles |
|-------------------|---------------:|----------------------------:|------------------------------:|---------------------------:|--------------------------:|
| sponsored_content | 3415           | 2                           | 0                             | 21                         | 0                         |
|                    report                    |
|----------------------------------------------|
| --- Enrichment via profile scraping (§5) --- |
| sponsored_creators_total |        scrape_method        |                              data_gained                              |             effort             | estimated_minutes |
|-------------------------:|-----------------------------|-----------------------------------------------------------------------|--------------------------------|------------------:|
| 3415                     | snapchat.com/add/<username> | follower_count, bio, category, spotlight_engagement, related_accounts | ~800ms/request, no auth needed | 45.5              |
|                       report                        |
|-----------------------------------------------------|
| --- Enrichment via spotlight page scraping (§7) --- |
| fetchable_spotlight_urls |        scrape_method        |                  data_gained                  |             effort             | estimated_hours |
|-------------------------:|-----------------------------|-----------------------------------------------|--------------------------------|----------------:|
| 13876                    | snapchat.com/spotlight/<id> | view_count, share_count, transcript, comments | ~800ms/request, no auth needed | 3.1             |
|                     report                      |
|-------------------------------------------------|
| --- Geographic signals in sponsored content --- |
|          finding           |                       detail                       |                    workaround                    | total_sponsors | non_latin_sponsors | non_latin_pct |
|----------------------------|----------------------------------------------------|--------------------------------------------------|---------------:|-------------------:|--------------:|
| No geographic field exists | creator_url domain is always snapchat.com (global) | Sponsor names in Arabic → MENA region (inferred) | 2987           | 0                  | 0.0           |
```

---

## 09_paid_creator_content

```
|                        report                        |
|------------------------------------------------------|
| === Experiment 9: Paid Creator Content Detection === |
|                      report                       |
|---------------------------------------------------|
| --- Creator/UGC signal prevalence in paid ads --- |
| total_ads | creator_signal_ads | pct |
|----------:|-------------------:|----:|
| 4694      | 145                | 3.1 |
|              report              |
|----------------------------------|
| --- Breakdown by signal type --- |
|     signal_type     | unique_ads | brands | total_impressions | impressions_M |
|---------------------|-----------:|-------:|------------------:|--------------:|
| UGC                 | 81         | 10     | 40547676          | 40.55         |
| Creator             | 9          | 2      | 4577208           | 4.58          |
| Partnership Ad      | 3          | 2      | 3320843           | 3.32          |
| Influencer          | 3          | 3      | 1125910           | 1.13          |
| Collab              | 8          | 1      | 130110            | 0.13          |
| Partnership (other) | 2          | 1      | 2180              | 0.0           |
|                      report                      |
|--------------------------------------------------|
| --- Brands using creator content in paid ads --- |
|  paying_advertiser_name  | creator_ads | total_impressions | est_spend_low_eur | est_spend_high_eur | markets |
|--------------------------|------------:|------------------:|------------------:|-------------------:|--------:|
| Birkenstock Digital GmbH | 7           | 5950684           | 23803.0           | 53556.0            | 6       |
| CAUDALIE SAS             | 9           | 3179537           | 12718.0           | 28616.0            | 2       |
| boohooMAN                | 5           | 1966509           | 7866.0            | 17699.0            | 2       |
| Givenchy Beauty          | 1           | 1519415           | 6078.0            | 13675.0            | 1       |
| Pandora A/S              | 1           | 955997            | 3824.0            | 8604.0             | 1       |
| Wild Cosmetics           | 11          | 583492            | 2334.0            | 5251.0             | 4       |
| Axel Arigato             | 2           | 537855            | 2151.0            | 4841.0             | 2       |
| CAIAcosmetics            | 7           | 430371            | 1721.0            | 3873.0             | 3       |
| Zing Coach Inc.          | 5           | 425742            | 1703.0            | 3832.0             | 1       |
| ANNEBRAUNER              | 4           | 169581            | 678.0             | 1526.0             | 1       |
| Dekbedovertrek.nl        | 4           | 169224            | 677.0             | 1523.0             | 1       |
| Kiabi                    | 1           | 149767            | 599.0             | 1348.0             | 1       |
| HUGO BOSS AG             | 8           | 130110            | 520.0             | 1171.0             | 1       |
| Safe Digital Marketing   | 1           | 20146             | 81.0              | 181.0              | 1       |
| adidas AG                | 7           | 17049             | 68.0              | 153.0              | 1       |
|                            report                            |
|--------------------------------------------------------------|
| --- Creator names extractable from ad naming conventions --- |
| paying_advertiser_name |  creator_name  | ads | impressions |
|------------------------|----------------|----:|------------:|
| CAIAcosmetics          | biancaingrosso | 4   | 422148      |
| CAIAcosmetics          | basma_bada     | 1   | 5995        |
| CAIAcosmetics          | sabinasarkka   | 1   | 1989        |
| CAIAcosmetics          | Iamangejose    | 1   | 239         |
|                             report                             |
|----------------------------------------------------------------|
| --- Creator vs non-creator ad mix for brands that use both --- |
|  paying_advertiser_name  | all_impressions | creator_impressions | creator_pct |
|--------------------------|----------------:|--------------------:|------------:|
| Wild Cosmetics           | 608668          | 583492              | 95.9        |
| Dekbedovertrek.nl        | 233154          | 169224              | 72.6        |
| CAIAcosmetics            | 970261          | 430371              | 44.4        |
| Safe Digital Marketing   | 65194           | 20146               | 30.9        |
| CAUDALIE SAS             | 11735754        | 3179537             | 27.1        |
| Zing Coach Inc.          | 1799861         | 425742              | 23.7        |
| ANNEBRAUNER              | 944967          | 169581              | 17.9        |
| Givenchy Beauty          | 15143443        | 1519415             | 10.0        |
| Axel Arigato             | 13472995        | 537855              | 4.0         |
| Birkenstock Digital GmbH | 159961557       | 5950684             | 3.7         |
| boohooMAN                | 88917761        | 1966509             | 2.2         |
| Pandora A/S              | 48168205        | 955997              | 2.0         |
| Kiabi                    | 8969109         | 149767              | 1.7         |
| HUGO BOSS AG             | 110331091       | 130110              | 0.1         |
| adidas AG                | 34717817        | 17049               | 0.0         |
```

---

## 10_creator_name_extraction

```
|                     report                     |
|------------------------------------------------|
| === Experiment 10: Creator Name Extraction === |
|                              report                               |
|-------------------------------------------------------------------|
| --- Identified brand-creator pairs from ad naming conventions --- |
|          brand           | creator_identified | unique_ads | total_impressions | est_spend_low_eur | est_spend_high_eur |
|--------------------------|--------------------|-----------:|------------------:|------------------:|-------------------:|
| Givenchy Beauty          | Sullivan           | 4          | 2413445           | 9654.0            | 21721.0            |
| Pandora A/S              | Lara GCV           | 1          | 955997            | 3824.0            | 8604.0             |
| CAIAcosmetics            | Bianca Ingrosso    | 5          | 845678            | 3383.0            | 7611.0             |
| Wild Cosmetics           | Greta              | 2          | 328418            | 1314.0            | 2956.0             |
| Birkenstock Digital GmbH | Aldara             | 1          | 231803            | 927.0             | 2086.0             |
| Wild Cosmetics           | Lauren             | 4          | 141392            | 566.0             | 1273.0             |
| Wild Cosmetics           | Clara              | 3          | 84193             | 337.0             | 758.0              |
| HUGO BOSS AG             | Jayde Pierce       | 4          | 80340             | 321.0             | 723.0              |
| HUGO BOSS AG             | Julien Brown       | 4          | 49770             | 199.0             | 448.0              |
| CAIAcosmetics            | Basma Bada         | 1          | 5995              | 24.0              | 54.0               |
| Wild Cosmetics           | Lewis              | 1          | 3128              | 13.0              | 28.0               |
| CAIAcosmetics            | Sabina Sarkka      | 1          | 1989              | 8.0               | 18.0               |
| CAIAcosmetics            | Ange Jose          | 1          | 239               | 1.0               | 2.0                |
|                   report                    |
|---------------------------------------------|
| --- Unsponsored creator activity levels --- |
| activity_level | creators | total_content | uses_both_formats |
|----------------|---------:|--------------:|------------------:|
| 1 piece        | 43207    | 43207         | 0                 |
| 2-5 pieces     | 10850    | 29986         | 1185              |
| 6-20 pieces    | 3320     | 33318         | 870               |
| 21-50 pieces   | 850      | 26872         | 378               |
| 50+ pieces     | 512      | 70344         | 345               |
|                            report                            |
|--------------------------------------------------------------|
| --- Creators with both sponsored and unsponsored content --- |
| creators_with_both | avg_sponsored_pieces | avg_unsponsored_pieces |
|-------------------:|---------------------:|-----------------------:|
| 455                | 12.2                 | 24.2                   |
|                        report                         |
|-------------------------------------------------------|
| --- Targeting on Birkenstock creator vs brand ads --- |
| ad_type | ads | avg_impressions | min_ages |  max_ages  |
|---------|----:|----------------:|----------|------------|
| brand   | 73  | 2109738.0       | [18]     | [NULL]     |
| creator | 7   | 850098.0        | [18]     | [NULL, 39] |
```

---

## 11_organic_presence

```
|                      report                      |
|--------------------------------------------------|
| === Experiment 11: Organic Presence Analysis === |
|                report                 |
|---------------------------------------|
| --- Brand maturity classification --- |
|            tier            | brands |
|----------------------------|-------:|
| A: active (subs + content) | 9      |
| B: audience only           | 3      |
| C: content producer        | 19     |
| D: dormant                 | 42     |
| E: username squatted       | 27     |
|                report                |
|--------------------------------------|
| --- Username squatting detection --- |
|       brand        |    username     |          title          |
|--------------------|-----------------|-------------------------|
| Bottega Veneta     | bottega-veneta  | Sapp-DeLuxe⌚️🐊         |
| Canada Goose       | canadagoose     | 𝒶𝓎𝒹𝑒𝓃 🪶🦦              |
| Caudalie           | caudalie        | Meryem🩷🩷🩷            |
| Chanel             | chanel          | Pauline💋👠             |
| Diesel             | diesel_official | Gabriel 🎰              |
| Dolce & Gabbana    | dolcegabbana    | dolcegabbana            |
| Hermes             | hermes          | mayed                   |
| Jack Wolfskin      | jackwolfskin    | Kais Almisrati          |
| Levi's             | levis           | levi turner             |
| Massimo Dutti      | massimo-dutti   | Massimo 🍕              |
| Miu Miu            | miumiu_official | MiuMiu Company ℘.       |
| Mohito             | mohito          | Andreas ØB              |
| Notino             | notino          | ‎                        |
| Peek & Cloppenburg | peekcloppenburg | Peek Und Cloppenburg At |
| Primark            | primark         | Pri_mark_ 40            |
| Rare Beauty        | rare_beauty     | Tamarah Sarah 💰〽️      |
| Ray-Ban            | ray-ban         | Raven 🖤                |
| Rexona             | rexona          | Killa                   |
| Saint Laurent      | saint_laurent   | Rich                    |
| Salomon            | salomonofficial | Salomón Official        |
| Stradivarius       | stradivarius    | Wes                     |
| Swarovski          | swarovski       | Kine 😈😇               |
| TK Maxx            | tk-maxx         | Tanaka 🧞‍♂️               |
| The Ordinary       | the-ordinary    | _blvcknoble_            |
| Too Faced          | toofaced        | eric Gilbreth           |
| Urban Decay        | urban-decay     | Mel                     |
| Vero Moda          | veromoda        | veromoda                |
|                    report                     |
|-----------------------------------------------|
| --- Profile completeness scoring (top 20) --- |
|       brand       | subscriber_count | score_of_8 | spotlight_count |
|-------------------|-----------------:|-----------:|----------------:|
| Shein             | 491500           | 7          | 16              |
| Prada             | 52500            | 7          | 16              |
| Jimmy Choo        | 11700            | 7          | 16              |
| Carolina Herrera  | 0                | 7          | 16              |
| Cartier           | 0                | 7          | 16              |
| Clarins           | 0                | 7          | 18              |
| Dior              | 0                | 7          | 16              |
| Fendi             | 0                | 7          | 3               |
| H&M               | 0                | 7          | 10              |
| Louis Vuitton     | 0                | 7          | 16              |
| Michael Kors      | 0                | 7          | 16              |
| MAC               | 65800            | 6          | 6               |
| Balenciaga        | 52800            | 6          | 16              |
| Clinique          | 20800            | 6          | 2               |
| Bath & Body Works | 0                | 6          | 2               |
| Gucci             | 0                | 6          | 15              |
| Nike              | 0                | 6          | 9               |
| Paco Rabanne      | 0                | 6          | 1               |
| Ralph Lauren      | 0                | 6          | 1               |
| Timberland        | 0                | 6          | 16              |
|                      report                      |
|--------------------------------------------------|
| --- Engagement rates (brands with views > 0) --- |
|      brand       | videos |  views  | share_rate_pct | boost_rate_pct | comment_rate_pct | avg_duration_s |
|------------------|-------:|--------:|---------------:|---------------:|-----------------:|---------------:|
| Gymshark         | 16     | 1886614 | 0.16           | 7.11           | 0.001            | 14.7           |
| Louis Vuitton    | 16     | 980098  | 0.16           | 2.66           | 0.102            | 24.2           |
| H&M              | 10     | 357774  | 0.03           | 0.13           | 0.002            | 10.4           |
| Dior             | 14     | 200787  | 0.13           | 6.33           | 0.105            | 22.4           |
| Carolina Herrera | 10     | 136233  | 0.01           | 0.42           | 0.002            | 19.5           |
| Nike             | 9      | 131397  | 0.01           | 1.06           | 0.043            | 40.4           |
| Cartier          | 12     | 84177   | 0.09           | 2.06           | 0.039            | 15.1           |
| Shein            | 16     | 57111   | 0.13           | 6.97           | 0.103            | 24.7           |
| Gucci            | 8      | 55966   | 0.6            | 0.61           | 0.041            | 33.6           |
| Balenciaga       | 11     | 29628   | 0.04           | 4.43           | 0.057            | 12.8           |
| Jordan           | 1      | 22458   | 0.09           | 1.08           | 0.062            | 5.2            |
| Michael Kors     | 7      | 20755   | 0.01           | 0.84           | 0.043            | 19.1           |
| Zara             | 6      | 10805   | 0.09           | 1.61           | 0.139            | 16.7           |
| Clarins          | 5      | 7687    | 0.1            | 2.24           | 0.0              | 14.2           |
| Timberland       | 6      | 7061    | 0.08           | 4.22           | 0.085            | 12.4           |
| Prada            | 3      | 5247    | 0.06           | 0.29           | 0.0              | 19.9           |
| Fendi            | 2      | 2169    | 0.69           | 4.47           | 0.323            | 35.7           |
| MAC              | 1      | 2114    | 1.09           | 0.57           | 0.0              | 8.9            |
| Ralph Lauren     | 1      | 1587    | 0.32           | 4.98           | 0.693            | 22.4           |
| Omega            | 1      | 1485    | 0.0            | 0.07           | 0.0              | 20.0           |
| Tiffany          | 1      | 1175    | 0.43           | 6.47           | 0.0              | 60.0           |
| Clinique         | 1      | 1087    | 0.46           | 6.72           | 0.184            | 17.3           |
|             report              |
|---------------------------------|
| --- Duration vs performance --- |
|  bucket   | videos | avg_views | avg_shares | avg_boosts |
|-----------|-------:|----------:|-----------:|-----------:|
| 1: <10s   | 36     | 30617.0   | 52.0       | 2552.0     |
| 2: 10-20s | 69     | 24254.0   | 47.0       | 1068.0     |
| 3: 20-30s | 22     | 44267.0   | 12.0       | 302.0      |
| 4: 30-60s | 25     | 5609.0    | 9.0        | 395.0      |
| 5: 60s+   | 5      | 22717.0   | 8.0        | 428.0      |
|                 report                  |
|-----------------------------------------|
| --- Posting cadence (active brands) --- |
|       brand       | videos | first_post | last_post  | span_days | avg_days_between_posts |
|-------------------|-------:|------------|------------|----------:|-----------------------:|
| Prada             | 16     | 2026-03-15 | 2026-04-08 | 24.0      | 1.6                    |
| Tiffany           | 6      | 2026-04-07 | 2026-04-08 | 1.0       | 0.2                    |
| Omega             | 16     | 2026-02-25 | 2026-04-07 | 41.0      | 2.7                    |
| Dior              | 16     | 2026-01-30 | 2026-04-02 | 62.0      | 4.1                    |
| Cartier           | 16     | 2025-10-01 | 2026-04-02 | 183.0     | 12.2                   |
| Moncler           | 16     | 2026-01-28 | 2026-04-01 | 63.0      | 4.2                    |
| Gucci             | 15     | 2025-11-05 | 2026-03-24 | 139.0     | 9.9                    |
| Balenciaga        | 16     | 2025-10-10 | 2026-03-20 | 161.0     | 10.7                   |
| Nike              | 9      | 2026-02-08 | 2026-03-18 | 38.0      | 4.7                    |
| Crocs             | 21     | 2025-05-06 | 2026-03-16 | 314.0     | 15.7                   |
| Jimmy Choo        | 16     | 2026-01-08 | 2026-02-24 | 47.0      | 3.1                    |
| Carolina Herrera  | 16     | 2024-11-17 | 2026-02-16 | 456.0     | 30.4                   |
| Shein             | 16     | 2026-01-16 | 2026-01-23 | 7.0       | 0.5                    |
| Timberland        | 16     | 2023-07-27 | 2025-12-06 | 863.0     | 57.5                   |
| Louis Vuitton     | 16     | 2025-05-24 | 2025-10-03 | 132.0     | 8.8                    |
| Fendi             | 3      | 2025-09-25 | 2025-09-28 | 3.0       | 1.5                    |
| Michael Kors      | 16     | 2025-07-23 | 2025-09-23 | 62.0      | 4.1                    |
| H&M               | 10     | 2025-07-24 | 2025-08-14 | 21.0      | 2.3                    |
| Miu Miu           | 7      | 2025-07-04 | 2025-07-07 | 3.0       | 0.5                    |
| MAC               | 6      | 2023-10-12 | 2025-01-23 | 469.0     | 93.8                   |
| Clinique          | 2      | 2024-08-15 | 2024-11-01 | 78.0      | 78.1                   |
| Paco Rabanne      | 1      | 2024-05-30 | 2024-05-30 | 0.0       | NULL                   |
| Bath & Body Works | 2      | 2023-10-27 | 2024-04-12 | 168.0     | 168.1                  |
| & Other Stories   | 7      | 2024-01-03 | 2024-02-01 | 29.0      | 4.8                    |
| Clarins           | 18     | 2022-07-08 | 2023-08-26 | 414.0     | 24.3                   |
| Zara              | 12     | 1970-01-01 | 2023-04-27 | 19475.0   | 1770.4                 |
| Gymshark          | 17     | 2021-09-21 | 2022-08-15 | 328.0     | 20.5                   |
| Ralph Lauren      | 1      | 2022-03-02 | 2022-03-02 | 0.0       | NULL                   |
| Jordan            | 2      | 1970-01-01 | 2022-01-18 | 19011.0   | 19011.0                |
|                         report                         |
|--------------------------------------------------------|
| --- Paid vs organic alignment (top 15 advertisers) --- |
|                  advertiser                   | paid_impressions | subscriber_count | spotlight_count |   organic_status   |
|-----------------------------------------------|-----------------:|-----------------:|----------------:|--------------------|
| Nike, Inc.                                    | 516493328        | 0                | 9               | CONTENT ONLY       |
| Birkenstock Digital GmbH                      | 159961557        | NULL             | NULL            | NO PROFILE SCRAPED |
| HUGO BOSS AG                                  | 110331091        | NULL             | NULL            | NO PROFILE SCRAPED |
| Cartier, Branch of Richemont International SA | 108191806        | 0                | 16              | CONTENT ONLY       |
| Zalando SE                                    | 93942169         | NULL             | NULL            | NO PROFILE SCRAPED |
| boohooMAN                                     | 88917761         | 0                | 0               | DORMANT            |
| Tommy Hilfiger Europe B.V.                    | 66548281         | 0                | 0               | DORMANT            |
| Canada Goose                                  | 55980115         | 0                | 0               | DORMANT            |
| Dr. Martens                                   | 51584280         | 0                | 0               | DORMANT            |
| CHANEL                                        | 49378313         | 0                | 0               | DORMANT            |
| Pandora A/S                                   | 48168205         | 0                | 0               | DORMANT            |
| Dior                                          | 47915398         | 0                | 16              | CONTENT ONLY       |
| Guccio Gucci S.p.A.                           | 47895876         | 0                | 15              | CONTENT ONLY       |
| COTY GLOBAL ORGANIZATION managed by Publicis  | 36732567         | NULL             | NULL            | NO PROFILE SCRAPED |
| Jordan                                        | 34822561         | 204400           | 2               | ACTIVE             |
|                         report                         |
|--------------------------------------------------------|
| --- Content themes (top viewed LLM-titled content) --- |
|      brand       |                                 llm_title                                 | view_count |
|------------------|---------------------------------------------------------------------------|-----------:|
| H&M              | H&M Street Style: A Model's Chic Look with Braids and Sunglasses          | 273204     |
| Nike             | A'ja Wilson Plays Basketball Game & Answers Fan Questions                 | 97480      |
| Louis Vuitton    | Louis Vuitton Runway Model Walks Paris Streets Before Show                | 47973      |
| Dior             | Behind the Scenes of a Dior Fashion Show: From Delivery to Final Bow      | 31314      |
| Dior             | Dior Runway Shoes: A Closer Look at the Latest High-Fashion Heels         | 28970      |
| Louis Vuitton    | Louis Vuitton's Spring Campaign: A Stylish Journey Through Paris          | 27306      |
| H&M              | H&M Travel Style: A Street-Ready Look for the Modern Commuter             | 26919      |
| Dior             | Dior's Latest Earrings: A Showcase of Artistic Jewelry Design             | 24613      |
| H&M              | H&M Office Chic: How to Style Your Workwear for a Modern Look             | 21836      |
| Carolina Herrera | Carolina Herrera Fashion Show: A Modern Runway Spectacle                  | 19563      |
| Carolina Herrera | Carolina Herrera Fashion Show: Behind-the-Scenes & Runway Moments         | 19530      |
| Cartier          | Cartier Watches Unboxed: A Tale of Luxury & Elegance                      | 19246      |
| Carolina Herrera | Carolina Herrera Runway: A Showcase of Elegance and Modern Silhouettes    | 18185      |
| Carolina Herrera | Carolina Herrera Fashion Show 2024: A Night of Elegance & Color           | 17787      |
| Cartier          | Cartier Panther Necklace Unveiled: A Masterpiece of Emeralds and Diamonds | 17767      |
|               report               |
|------------------------------------|
| --- Platform adoption timeline --- |
|      year_group       | brands | avg_subscribers | with_spotlights |
|-----------------------|-------:|----------------:|----------------:|
| 2019 (early adopters) | 3      | 17500.0         | 3               |
| 2020                  | 10     | 48130.0         | 6               |
| 2021                  | 15     | 42747.0         | 6               |
| 2022                  | 31     | 2277.0          | 7               |
| 2023                  | 16     | 0.0             | 2               |
| 2024                  | 9      | 1244.0          | 2               |
| 2025-2026             | 16     | 0.0             | 3               |
```

