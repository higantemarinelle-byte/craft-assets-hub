
-- ================= THEME SETTINGS =================
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  published jsonb NOT NULL DEFAULT '{}'::jsonb,
  draft_updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  singleton boolean NOT NULL DEFAULT true UNIQUE
);
GRANT SELECT ON public.theme_settings TO anon, authenticated;
GRANT UPDATE ON public.theme_settings TO authenticated;
GRANT ALL ON public.theme_settings TO service_role;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read published theme"
  ON public.theme_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff can update theme"
  ON public.theme_settings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================= THEME VERSIONS =================
CREATE TABLE public.theme_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot jsonb NOT NULL,
  label text,
  published_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.theme_versions TO authenticated;
GRANT ALL ON public.theme_versions TO service_role;
ALTER TABLE public.theme_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read versions"
  ON public.theme_versions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "owners insert versions"
  ON public.theme_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owners delete versions"
  ON public.theme_versions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- ================= DEFAULT THEME =================
INSERT INTO public.theme_settings (draft, published, published_at) VALUES (
  '{
    "brand": {"name":"Craft & Cling","tagline":"Print louder. Press faster.","logoUrl":null,"primary":"#ec3b83","accent":"#00b6d8"},
    "announcement": {"enabled":true,"text":"Free shipping on orders over $75 · Ships in 48h","link":"/shop"},
    "nav": {"items":[{"label":"Shop","href":"/shop"},{"label":"Gang Sheets","href":"/gang-sheet"},{"label":"How it works","href":"/how-it-works"},{"label":"About","href":"/about"}]},
    "footer": {
      "blurb":"Pigment-loud DTF transfers, printed to order and shipped fast.",
      "columns":[
        {"title":"Shop","links":[{"label":"All transfers","href":"/shop"},{"label":"Gang sheet builder","href":"/gang-sheet"}]},
        {"title":"Learn","links":[{"label":"How DTF works","href":"/how-it-works"},{"label":"About us","href":"/about"}]}
      ],
      "socials":[{"kind":"instagram","href":"https://instagram.com"},{"kind":"email","href":"mailto:hello@craftandcling.com"}],
      "contactEmail":"hello@craftandcling.com",
      "legal":"© Craft & Cling"
    },
    "home": {
      "hero":{"eyebrow":"New drop weekly · Ships in 48h","headlineA":"Print","headlineHighlightA":"louder.","headlineB":"Press","headlineHighlightB":"faster.","body":"Pigment-loud Direct-to-Film transfers, custom gang sheets, and bulk designs — printed on demand and shipped to apparel makers.","ctaPrimaryLabel":"Shop transfers","ctaPrimaryHref":"/shop","ctaSecondaryLabel":"Build a gang sheet","ctaSecondaryHref":"/gang-sheet","imageUrl":null},
      "marquee":{"enabled":true,"items":["Ships in 48 hours","Free over $75","Wholesale pricing","No minimum orders","Custom designs welcome"]},
      "sections":[
        {"id":"categories","type":"categories","enabled":true,"title":"Shop by category"},
        {"id":"featured","type":"featured","enabled":true,"title":"Best sellers","eyebrow":"On the press"},
        {"id":"how","type":"how","enabled":true,"title":"Three steps to shirt.","eyebrow":"How DTF works"},
        {"id":"testimonials","type":"testimonials","enabled":true,"title":"Makers who ship with us","items":[
          {"quote":"The whites are actually white. Every other DTF I''ve tried yellows after a wash — these don''t.","author":"Maya R., Loud Threads Co."},
          {"quote":"Ordered a 22x24 gang sheet at 11pm, pressed shirts by Friday. Cannot be beat.","author":"Devin K., Signal & Salt"},
          {"quote":"Cheaper than screens for our short runs and the color pop is unreal.","author":"Ana T., Kettle Print Studio"}
        ]}
      ]
    },
    "pages": {
      "shop":{"banner":{"title":"All transfers","body":"Ready-to-press DTF designs, sized and priced for makers."}},
      "product":{"trustBadges":["48h turnaround","Vibrant CMYK+W","Free shipping $75+"]},
      "about":{"blocks":[{"heading":"Built by makers, for makers","body":"We started Craft & Cling because DTF should be loud, reliable, and shipped on time. Nothing fancy — just great transfers, fast."}]}
    },
    "inventory": {"lowStockThreshold": 10}
  }'::jsonb,
  '{}'::jsonb,
  NULL
);

-- Copy draft to published on first row
UPDATE public.theme_settings SET published = draft, published_at = now();
