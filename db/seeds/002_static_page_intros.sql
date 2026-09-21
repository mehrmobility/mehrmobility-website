INSERT OR IGNORE INTO cms_documents (id,kind,slug,locale,status,published_revision_id,created_by,created_at,updated_at) VALUES
('page-about','page','about','fa-IR','published','revision-about-1','system-seed',datetime('now'),datetime('now')),
('page-contact','page','contact','fa-IR','published','revision-contact-1','system-seed',datetime('now'),datetime('now'));
INSERT OR IGNORE INTO cms_document_revisions (id,document_id,revision_no,body_json,seo_json,created_by,created_at) VALUES
('revision-about-1','page-about',1,'{"intro":{"title":"مهر؛ نامی برای همراهی","eyebrow":"THE MEHR STORY","description":"از سال ۱۳۹۱، در مسیر انتخاب و نگهداری خودرو."}}','{"title":"درباره مهر خودرو"}','system-seed',datetime('now')),
('revision-contact-1','page-contact',1,'{"intro":{"title":"از نزدیک، در کنار شما","eyebrow":"MEET MEHR","description":"برای انتخاب خودرو، خدمات یا پیگیری درخواست، با شعب مهر در ارتباط باشید."}}','{"title":"تماس با مهر خودرو"}','system-seed',datetime('now'));
