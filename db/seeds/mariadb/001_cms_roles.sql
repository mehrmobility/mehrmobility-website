-- Run only against the isolated Mehr CMS database after 001_mehr_cms.sql.
-- No CMS user is created here: create the first SYSTEM_ADMIN through the
-- approved secret/password-hash procedure, never with a plaintext SQL value.
INSERT INTO cms_roles (id,code,title) VALUES
  ('role-system-admin','SYSTEM_ADMIN','مدیر سیستم'),
  ('role-content-editor','CONTENT_EDITOR','ویرایشگر محتوا'),
  ('role-reviewer','REVIEWER','بازبین و ناشر'),
  ('role-catalog-manager','CATALOG_MANAGER','مدیر کاتالوگ'),
  ('role-seo-manager','SEO_MANAGER','مدیر SEO'),
  ('role-support-agent','SUPPORT_AGENT','کارشناس پشتیبانی')
ON DUPLICATE KEY UPDATE title=VALUES(title);
