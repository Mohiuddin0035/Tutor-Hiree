\restrict 6aclq1k324VQKi1fmZL4GzM2xiTiPfMLucXEGTUIB70U1MdW5hbNYJFw0tWz8XK

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA public;

ALTER SCHEMA public OWNER TO pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.blacklist (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255),
    name character varying(255),
    phone character varying(255) NOT NULL,
    reason text,
    role character varying(255)
);

ALTER TABLE public.blacklist OWNER TO postgres;

CREATE TABLE public.blacklists (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255),
    name character varying(255),
    phone character varying(255) NOT NULL,
    reason text,
    role character varying(255)
);

ALTER TABLE public.blacklists OWNER TO postgres;

CREATE TABLE public.guardian_comment (
    id character varying(255) NOT NULL,
    comment text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    guardian_id character varying(255) NOT NULL,
    progress_update_id character varying(255) NOT NULL
);

ALTER TABLE public.guardian_comment OWNER TO postgres;

CREATE TABLE public.guardian_comments (
    id character varying(255) NOT NULL,
    comment text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    guardian_id character varying(255) NOT NULL,
    progress_update_id character varying(255) NOT NULL
);

ALTER TABLE public.guardian_comments OWNER TO postgres;

CREATE TABLE public.homework (
    id character varying(255) NOT NULL,
    assigned_date timestamp(6) without time zone,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    due_date timestamp(6) without time zone,
    status character varying(255),
    subject character varying(255),
    title character varying(255),
    tutor_remarks text,
    updated_at timestamp(6) without time zone NOT NULL,
    job_id character varying(255) NOT NULL,
    progress_update_id character varying(255),
    tutor_id character varying(255) NOT NULL
);

ALTER TABLE public.homework OWNER TO postgres;

CREATE TABLE public.homeworks (
    id character varying(255) NOT NULL,
    assigned_date timestamp(6) without time zone,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    due_date timestamp(6) without time zone,
    status character varying(255),
    subject character varying(255),
    title character varying(255),
    tutor_remarks text,
    updated_at timestamp(6) without time zone NOT NULL,
    job_id character varying(255) NOT NULL,
    progress_update_id character varying(255),
    tutor_id character varying(255) NOT NULL
);

ALTER TABLE public.homeworks OWNER TO postgres;

CREATE TABLE public.password_reset (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    otp character varying(255) NOT NULL
);

ALTER TABLE public.password_reset OWNER TO postgres;

CREATE TABLE public.password_resets (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    otp character varying(255) NOT NULL
);

ALTER TABLE public.password_resets OWNER TO postgres;

CREATE TABLE public.payment (
    id character varying(255) NOT NULL,
    amount integer,
    created_at timestamp(6) without time zone NOT NULL,
    payer_role character varying(255),
    refund_reason text,
    refund_requested_at timestamp(6) without time zone,
    refund_status character varying(255),
    status character varying(255),
    trx_id character varying(255),
    tutor_id character varying(255),
    type character varying(255),
    updated_at timestamp(6) without time zone NOT NULL,
    job_id character varying(255) NOT NULL
);

ALTER TABLE public.payment OWNER TO postgres;

CREATE TABLE public.payments (
    id character varying(255) NOT NULL,
    amount integer,
    created_at timestamp(6) without time zone NOT NULL,
    payer_role character varying(255),
    refund_reason text,
    refund_requested_at timestamp(6) without time zone,
    refund_status character varying(255),
    status character varying(255),
    trx_id character varying(255),
    tutor_id character varying(255),
    type character varying(255),
    updated_at timestamp(6) without time zone NOT NULL,
    job_id character varying(255) NOT NULL
);

ALTER TABLE public.payments OWNER TO postgres;

CREATE TABLE public.profile (
    id character varying(255) NOT NULL,
    actual_latitude double precision,
    actual_longitude double precision,
    address character varying(255),
    approx_latitude double precision,
    approx_longitude double precision,
    bio text,
    created_at timestamp(6) without time zone NOT NULL,
    education character varying(255),
    gender character varying(255),
    hours_required character varying(255),
    is_active boolean,
    latitude double precision,
    longitude double precision,
    nid_image_url character varying(255),
    number_of_children character varying(255),
    pending_bio text,
    pending_education character varying(255),
    phone character varying(255),
    preferable_time character varying(255),
    reactivation_requested boolean,
    rejected_at timestamp(6) without time zone,
    rejection_reason character varying(255),
    salary character varying(255),
    selfie_image_url character varying(255),
    student_class character varying(255),
    tutor_gender_preference character varying(255),
    tutor_seq integer NOT NULL,
    university_id_image_url character varying(255),
    updated_at timestamp(6) without time zone NOT NULL,
    verification_status character varying(255),
    user_id character varying(255) NOT NULL
);

ALTER TABLE public.profile OWNER TO postgres;

CREATE SEQUENCE public.profile_tutor_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.profile_tutor_seq_seq OWNER TO postgres;

ALTER SEQUENCE public.profile_tutor_seq_seq OWNED BY public.profile.tutor_seq;

CREATE TABLE public.profiles (
    id character varying(255) NOT NULL,
    actual_latitude double precision,
    actual_longitude double precision,
    address character varying(255),
    approx_latitude double precision,
    approx_longitude double precision,
    bio text,
    created_at timestamp(6) without time zone NOT NULL,
    education character varying(255),
    gender character varying(255),
    hours_required character varying(255),
    is_active boolean,
    latitude double precision,
    longitude double precision,
    nid_image_url character varying(255),
    number_of_children character varying(255),
    pending_bio text,
    pending_education character varying(255),
    phone character varying(255),
    preferable_time character varying(255),
    reactivation_requested boolean,
    rejected_at timestamp(6) without time zone,
    rejection_reason character varying(255),
    salary character varying(255),
    selfie_image_url character varying(255),
    student_class character varying(255),
    tutor_gender_preference character varying(255),
    tutor_seq integer NOT NULL,
    university_id_image_url character varying(255),
    updated_at timestamp(6) without time zone NOT NULL,
    verification_status character varying(255),
    user_id character varying(255) NOT NULL
);

ALTER TABLE public.profiles OWNER TO postgres;

CREATE SEQUENCE public.profiles_tutor_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.profiles_tutor_seq_seq OWNER TO postgres;

ALTER SEQUENCE public.profiles_tutor_seq_seq OWNED BY public.profiles.tutor_seq;

CREATE TABLE public.progress_update (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    rating integer,
    seen boolean,
    seen_at timestamp(6) without time zone,
    session_date timestamp(6) without time zone,
    title character varying(255),
    type character varying(255),
    updated_at timestamp(6) without time zone NOT NULL,
    guardian_id character varying(255) NOT NULL,
    job_id character varying(255) NOT NULL,
    tutor_id character varying(255) NOT NULL
);

ALTER TABLE public.progress_update OWNER TO postgres;

CREATE TABLE public.progress_update_attachment_urls (
    progress_update_id character varying(255) NOT NULL,
    attachment_urls character varying(255)
);

ALTER TABLE public.progress_update_attachment_urls OWNER TO postgres;

CREATE TABLE public.progress_update_attachments (
    progress_update_id character varying(255) NOT NULL,
    attachment_url character varying(255)
);

ALTER TABLE public.progress_update_attachments OWNER TO postgres;

CREATE TABLE public.progress_updates (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    rating integer,
    seen boolean,
    seen_at timestamp(6) without time zone,
    session_date timestamp(6) without time zone,
    title character varying(255),
    type character varying(255),
    updated_at timestamp(6) without time zone NOT NULL,
    guardian_id character varying(255) NOT NULL,
    job_id character varying(255) NOT NULL,
    tutor_id character varying(255) NOT NULL
);

ALTER TABLE public.progress_updates OWNER TO postgres;

CREATE TABLE public.review (
    id character varying(255) NOT NULL,
    comment text,
    created_at timestamp(6) without time zone NOT NULL,
    rating integer,
    updated_at timestamp(6) without time zone NOT NULL,
    author_id character varying(255) NOT NULL,
    target_id character varying(255) NOT NULL
);

ALTER TABLE public.review OWNER TO postgres;

CREATE TABLE public.reviews (
    id character varying(255) NOT NULL,
    comment text,
    created_at timestamp(6) without time zone NOT NULL,
    rating integer,
    updated_at timestamp(6) without time zone NOT NULL,
    author_id character varying(255) NOT NULL,
    target_id character varying(255) NOT NULL
);

ALTER TABLE public.reviews OWNER TO postgres;

CREATE TABLE public.tuition_job (
    id character varying(255) NOT NULL,
    approx_latitude double precision,
    approx_longitude double precision,
    class_level character varying(255),
    commission_amount integer,
    commission_paid boolean,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    job_seq integer NOT NULL,
    latitude double precision,
    location_unlocked boolean,
    longitude double precision,
    salary integer,
    status character varying(255),
    subject character varying(255),
    title character varying(255),
    tutor_details_released boolean,
    tutor_requirement text,
    updated_at timestamp(6) without time zone NOT NULL,
    parent_id character varying(255) NOT NULL,
    tutor_id character varying(255)
);

ALTER TABLE public.tuition_job OWNER TO postgres;

CREATE SEQUENCE public.tuition_job_job_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.tuition_job_job_seq_seq OWNER TO postgres;

ALTER SEQUENCE public.tuition_job_job_seq_seq OWNED BY public.tuition_job.job_seq;

CREATE TABLE public.tuition_jobs (
    id character varying(255) NOT NULL,
    approx_latitude double precision,
    approx_longitude double precision,
    class_level character varying(255),
    commission_amount integer,
    commission_paid boolean,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    job_seq integer NOT NULL,
    latitude double precision,
    location_unlocked boolean,
    longitude double precision,
    salary integer,
    status character varying(255),
    subject character varying(255),
    title character varying(255),
    tutor_details_released boolean,
    tutor_requirement text,
    updated_at timestamp(6) without time zone NOT NULL,
    parent_id character varying(255) NOT NULL,
    tutor_id character varying(255)
);

ALTER TABLE public.tuition_jobs OWNER TO postgres;

CREATE SEQUENCE public.tuition_jobs_job_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.tuition_jobs_job_seq_seq OWNER TO postgres;

ALTER SEQUENCE public.tuition_jobs_job_seq_seq OWNED BY public.tuition_jobs.job_seq;

CREATE TABLE public.users (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255),
    email_verified timestamp(6) without time zone,
    image character varying(255),
    name character varying(255),
    password character varying(255),
    role character varying(255),
    updated_at timestamp(6) without time zone NOT NULL
);

ALTER TABLE public.users OWNER TO postgres;

ALTER TABLE ONLY public.profile ALTER COLUMN tutor_seq SET DEFAULT nextval('public.profile_tutor_seq_seq'::regclass);

ALTER TABLE ONLY public.profiles ALTER COLUMN tutor_seq SET DEFAULT nextval('public.profiles_tutor_seq_seq'::regclass);

ALTER TABLE ONLY public.tuition_job ALTER COLUMN job_seq SET DEFAULT nextval('public.tuition_job_job_seq_seq'::regclass);

ALTER TABLE ONLY public.tuition_jobs ALTER COLUMN job_seq SET DEFAULT nextval('public.tuition_jobs_job_seq_seq'::regclass);

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.blacklists
    ADD CONSTRAINT blacklists_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.guardian_comment
    ADD CONSTRAINT guardian_comment_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.guardian_comments
    ADD CONSTRAINT guardian_comments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.homework
    ADD CONSTRAINT homework_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.homeworks
    ADD CONSTRAINT homeworks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.password_reset
    ADD CONSTRAINT password_reset_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.progress_update
    ADD CONSTRAINT progress_update_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.progress_updates
    ADD CONSTRAINT progress_updates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tuition_job
    ADD CONSTRAINT tuition_job_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tuition_jobs
    ADD CONSTRAINT tuition_jobs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.blacklists
    ADD CONSTRAINT uk10c3mcc0u1rxj49kvv9h214ug UNIQUE (phone);

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT uk11fv7c049073v29gp7525a0uc UNIQUE (email);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT uk4ixsj6aqve5pxrbw2u0oyk8bb UNIQUE (user_id);

ALTER TABLE ONLY public.tuition_jobs
    ADD CONSTRAINT uk4pq1yep0jyb1kigw9cfmn2auh UNIQUE (job_seq);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT uk8mi0wiivk6flh5idkgtmn57d3 UNIQUE (tutor_seq);

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT uk92bqi6ye9wrx9xi0f2xduh0mw UNIQUE (phone);

ALTER TABLE ONLY public.password_reset
    ADD CONSTRAINT uka0wj6di2teoht607vqk3bdlkf UNIQUE (email);

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT ukc1dkiawnlj6uoe6fnlwd6j83j UNIQUE (user_id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT ukfn1ctj9cufnptr90picb81sxa UNIQUE (trx_id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT ukii2k5inwku2ti1r344op2gvmj UNIQUE (trx_id);

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT ukkw8tm26r1wwl1hf5xuf7eatuu UNIQUE (tutor_seq);

ALTER TABLE ONLY public.tuition_job
    ADD CONSTRAINT ukxgawxsw0m0ay9myckerted24 UNIQUE (job_seq);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.homeworks
    ADD CONSTRAINT fk2wltbtstvk285yrsk5ovnynki FOREIGN KEY (progress_update_id) REFERENCES public.progress_updates(id);

ALTER TABLE ONLY public.guardian_comments
    ADD CONSTRAINT fk3r9tbfqkjn20akh17e6iqu1qo FOREIGN KEY (progress_update_id) REFERENCES public.progress_updates(id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT fk410q61iev7klncmpqfuo85ivh FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.homework
    ADD CONSTRAINT fk4hm1meegnmxlumer75tdlart1 FOREIGN KEY (job_id) REFERENCES public.tuition_job(id);

ALTER TABLE ONLY public.guardian_comment
    ADD CONSTRAINT fk6e6vuec5taec1lb21r4gjyvjg FOREIGN KEY (progress_update_id) REFERENCES public.progress_update(id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk7nxdogqtq60bypxrtk2rhvq56 FOREIGN KEY (target_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.progress_update_attachments
    ADD CONSTRAINT fk95fwx8nlpgr48d6gmajn6gion FOREIGN KEY (progress_update_id) REFERENCES public.progress_updates(id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fkagf2k4iuiwvsjhgrdqbd9m6ws FOREIGN KEY (job_id) REFERENCES public.tuition_jobs(id);

ALTER TABLE ONLY public.homeworks
    ADD CONSTRAINT fkbj6elqv9riydq34lxjprt1fyc FOREIGN KEY (tutor_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.homeworks
    ADD CONSTRAINT fkbqqe9ala4n0ya5cbgnvjv1lc7 FOREIGN KEY (job_id) REFERENCES public.tuition_jobs(id);

ALTER TABLE ONLY public.progress_updates
    ADD CONSTRAINT fkexhlq5aiqsys0fxmid5k8jrn5 FOREIGN KEY (job_id) REFERENCES public.tuition_jobs(id);

ALTER TABLE ONLY public.homework
    ADD CONSTRAINT fkfcdye5tegb2i2efervtqu4l4t FOREIGN KEY (progress_update_id) REFERENCES public.progress_update(id);

ALTER TABLE ONLY public.progress_update
    ADD CONSTRAINT fkfjb6ylp82hgwo2o3he1vdyh0w FOREIGN KEY (job_id) REFERENCES public.tuition_job(id);

ALTER TABLE ONLY public.tuition_jobs
    ADD CONSTRAINT fkg8ilck3efnl0803ugral160po FOREIGN KEY (tutor_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.progress_updates
    ADD CONSTRAINT fkkbk5ab4lcmhnlf89c4yrclda6 FOREIGN KEY (tutor_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT fkkq2e8chgo2xcih7ho6ct7hr4j FOREIGN KEY (job_id) REFERENCES public.tuition_job(id);

ALTER TABLE ONLY public.guardian_comments
    ADD CONSTRAINT fklvnqwdv2lyex4ruvxbl279jnu FOREIGN KEY (guardian_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.progress_update_attachment_urls
    ADD CONSTRAINT fkonrogc22r2t20c96miut3a6te FOREIGN KEY (progress_update_id) REFERENCES public.progress_updates(id);

ALTER TABLE ONLY public.progress_update_attachment_urls
    ADD CONSTRAINT fkp9wiudgjjj06uumlbqqb82y01 FOREIGN KEY (progress_update_id) REFERENCES public.progress_update(id);

ALTER TABLE ONLY public.tuition_jobs
    ADD CONSTRAINT fkpo4ryinxpjshk7auf3bq3y1w7 FOREIGN KEY (parent_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.progress_updates
    ADD CONSTRAINT fkquys0xyee08o4r4elld5snfo0 FOREIGN KEY (guardian_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fkse5kx11600wtv0jh9jobvrdpi FOREIGN KEY (author_id) REFERENCES public.users(id);

ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.blacklists ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.guardian_comment ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.guardian_comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.password_reset ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.progress_update ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.progress_update_attachment_urls ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.progress_update_attachments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.review ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tuition_job ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tuition_jobs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;

GRANT ALL ON TABLE public.blacklist TO anon;
GRANT ALL ON TABLE public.blacklist TO authenticated;
GRANT ALL ON TABLE public.blacklist TO service_role;

GRANT ALL ON TABLE public.blacklists TO anon;
GRANT ALL ON TABLE public.blacklists TO authenticated;
GRANT ALL ON TABLE public.blacklists TO service_role;

GRANT ALL ON TABLE public.guardian_comment TO anon;
GRANT ALL ON TABLE public.guardian_comment TO authenticated;
GRANT ALL ON TABLE public.guardian_comment TO service_role;

GRANT ALL ON TABLE public.guardian_comments TO anon;
GRANT ALL ON TABLE public.guardian_comments TO authenticated;
GRANT ALL ON TABLE public.guardian_comments TO service_role;

GRANT ALL ON TABLE public.homework TO anon;
GRANT ALL ON TABLE public.homework TO authenticated;
GRANT ALL ON TABLE public.homework TO service_role;

GRANT ALL ON TABLE public.homeworks TO anon;
GRANT ALL ON TABLE public.homeworks TO authenticated;
GRANT ALL ON TABLE public.homeworks TO service_role;

GRANT ALL ON TABLE public.password_reset TO anon;
GRANT ALL ON TABLE public.password_reset TO authenticated;
GRANT ALL ON TABLE public.password_reset TO service_role;

GRANT ALL ON TABLE public.password_resets TO anon;
GRANT ALL ON TABLE public.password_resets TO authenticated;
GRANT ALL ON TABLE public.password_resets TO service_role;

GRANT ALL ON TABLE public.payment TO anon;
GRANT ALL ON TABLE public.payment TO authenticated;
GRANT ALL ON TABLE public.payment TO service_role;

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;

GRANT ALL ON TABLE public.profile TO anon;
GRANT ALL ON TABLE public.profile TO authenticated;
GRANT ALL ON TABLE public.profile TO service_role;

GRANT ALL ON SEQUENCE public.profile_tutor_seq_seq TO anon;
GRANT ALL ON SEQUENCE public.profile_tutor_seq_seq TO authenticated;
GRANT ALL ON SEQUENCE public.profile_tutor_seq_seq TO service_role;

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

GRANT ALL ON SEQUENCE public.profiles_tutor_seq_seq TO anon;
GRANT ALL ON SEQUENCE public.profiles_tutor_seq_seq TO authenticated;
GRANT ALL ON SEQUENCE public.profiles_tutor_seq_seq TO service_role;

GRANT ALL ON TABLE public.progress_update TO anon;
GRANT ALL ON TABLE public.progress_update TO authenticated;
GRANT ALL ON TABLE public.progress_update TO service_role;

GRANT ALL ON TABLE public.progress_update_attachment_urls TO anon;
GRANT ALL ON TABLE public.progress_update_attachment_urls TO authenticated;
GRANT ALL ON TABLE public.progress_update_attachment_urls TO service_role;

GRANT ALL ON TABLE public.progress_update_attachments TO anon;
GRANT ALL ON TABLE public.progress_update_attachments TO authenticated;
GRANT ALL ON TABLE public.progress_update_attachments TO service_role;

GRANT ALL ON TABLE public.progress_updates TO anon;
GRANT ALL ON TABLE public.progress_updates TO authenticated;
GRANT ALL ON TABLE public.progress_updates TO service_role;

GRANT ALL ON TABLE public.review TO anon;
GRANT ALL ON TABLE public.review TO authenticated;
GRANT ALL ON TABLE public.review TO service_role;

GRANT ALL ON TABLE public.reviews TO anon;
GRANT ALL ON TABLE public.reviews TO authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;

GRANT ALL ON TABLE public.tuition_job TO anon;
GRANT ALL ON TABLE public.tuition_job TO authenticated;
GRANT ALL ON TABLE public.tuition_job TO service_role;

GRANT ALL ON SEQUENCE public.tuition_job_job_seq_seq TO anon;
GRANT ALL ON SEQUENCE public.tuition_job_job_seq_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tuition_job_job_seq_seq TO service_role;

GRANT ALL ON TABLE public.tuition_jobs TO anon;
GRANT ALL ON TABLE public.tuition_jobs TO authenticated;
GRANT ALL ON TABLE public.tuition_jobs TO service_role;

GRANT ALL ON SEQUENCE public.tuition_jobs_job_seq_seq TO anon;
GRANT ALL ON SEQUENCE public.tuition_jobs_job_seq_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tuition_jobs_job_seq_seq TO service_role;

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;

\unrestrict 6aclq1k324VQKi1fmZL4GzM2xiTiPfMLucXEGTUIB70U1MdW5hbNYJFw0tWz8XK

