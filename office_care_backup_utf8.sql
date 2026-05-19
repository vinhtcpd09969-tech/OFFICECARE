--
-- PostgreSQL database dump
--

\restrict Rkpgt4rrd2D4IuzsGqOKx2aMxygWbPsoi3oCJEj7LM7ieHKuOTnPaH9yv49Ku0J

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: buoi_tri_lieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buoi_tri_lieu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lich_dieu_tri_id uuid NOT NULL,
    khach_hang_id uuid NOT NULL,
    ky_thuat_vien_id uuid NOT NULL,
    phong_id bigint,
    dich_vu_id uuid,
    thoi_gian_bat_dau timestamp without time zone NOT NULL,
    thoi_gian_ket_thuc timestamp without time zone,
    danh_gia_truoc_buoi integer,
    danh_gia_sau_buoi integer,
    danh_gia_hieu_qua integer,
    so_thu_tu_buoi integer,
    danh_gia_id uuid,
    trang_thai character varying(20) DEFAULT 'dang_thuc_hien'::character varying NOT NULL,
    canh_bao_dac_biet text,
    ai_tom_tat_ngan character varying(300),
    thoi_gian_ghi_chu timestamp without time zone
);


ALTER TABLE public.buoi_tri_lieu OWNER TO postgres;

--
-- Name: chuyen_gia_y_te; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chuyen_gia_y_te (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    ma_nhan_vien character varying(20) NOT NULL,
    chuyen_mon_chinh character varying(200) NOT NULL,
    so_nam_kinh_nghiem integer,
    chung_chi text,
    mo_ta_ban_than text,
    anh_dai_dien_url text,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    ngay_vao_lam date
);


ALTER TABLE public.chuyen_gia_y_te OWNER TO postgres;

--
-- Name: danh_gia_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danh_gia_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buoi_tri_lieu_id uuid NOT NULL,
    khach_hang_id uuid NOT NULL,
    ky_thuat_vien_id uuid NOT NULL,
    so_sao_tong integer NOT NULL,
    so_sao_ktv integer,
    nhan_xet text,
    hieu_qua_dieu_tri character varying(30),
    se_quay_lai boolean,
    hien_thi_cong_khai boolean DEFAULT false NOT NULL,
    thoi_gian_danh_gia timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.danh_gia_dich_vu OWNER TO postgres;

--
-- Name: danh_muc_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danh_muc_dich_vu (
    id bigint NOT NULL,
    ten_danh_muc character varying(100) NOT NULL,
    mo_ta text,
    thu_tu_hien_thi integer DEFAULT 0 NOT NULL,
    an_hien boolean DEFAULT true NOT NULL
);


ALTER TABLE public.danh_muc_dich_vu OWNER TO postgres;

--
-- Name: danh_muc_dich_vu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.danh_muc_dich_vu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.danh_muc_dich_vu_id_seq OWNER TO postgres;

--
-- Name: danh_muc_dich_vu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.danh_muc_dich_vu_id_seq OWNED BY public.danh_muc_dich_vu.id;


--
-- Name: dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    danh_muc_id bigint NOT NULL,
    ten_dich_vu character varying(200) NOT NULL,
    mo_ta_ngan character varying(500),
    mo_ta_chi_tiet text,
    thoi_luong_phut integer NOT NULL,
    don_gia bigint NOT NULL,
    hinh_anh_url text,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    thu_tu_hien_thi integer DEFAULT 0 NOT NULL,
    thiet_bi_yeu_cau character varying(100)
);


ALTER TABLE public.dich_vu OWNER TO postgres;

--
-- Name: goi_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goi_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten_goi character varying(200) NOT NULL,
    ma_goi character varying(30) NOT NULL,
    mo_ta text,
    tong_so_buoi integer NOT NULL,
    gia_goi bigint NOT NULL,
    gia_goc bigint,
    han_dung_thang integer DEFAULT 6 NOT NULL,
    hien_thi_website boolean DEFAULT true NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    chi_tiet_dich_vu jsonb DEFAULT '[]'::jsonb,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    danh_muc_id bigint
);


ALTER TABLE public.goi_dich_vu OWNER TO postgres;

--
-- Name: goi_dich_vu_chi_tiet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goi_dich_vu_chi_tiet (
    id integer NOT NULL,
    goi_dich_vu_id uuid,
    dich_vu_id uuid,
    so_buoi_trong_goi integer DEFAULT 1
);


ALTER TABLE public.goi_dich_vu_chi_tiet OWNER TO postgres;

--
-- Name: goi_dich_vu_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goi_dich_vu_chi_tiet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.goi_dich_vu_chi_tiet_id_seq OWNER TO postgres;

--
-- Name: goi_dich_vu_chi_tiet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goi_dich_vu_chi_tiet_id_seq OWNED BY public.goi_dich_vu_chi_tiet.id;


--
-- Name: hoa_don; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hoa_don (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_hoa_don character varying(20) NOT NULL,
    khach_hang_id uuid NOT NULL,
    loai_hoa_don character varying(20) NOT NULL,
    lich_dat_id uuid,
    dang_ky_goi_id uuid,
    tong_tien_truoc_giam bigint DEFAULT 0 NOT NULL,
    so_tien_giam bigint DEFAULT 0 NOT NULL,
    tong_tien_thanh_toan bigint NOT NULL,
    da_thanh_toan bigint DEFAULT 0 NOT NULL,
    trang_thai character varying(30) DEFAULT 'chua_thanh_toan'::character varying NOT NULL,
    ghi_chu text,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    ngay_thanh_toan timestamp without time zone,
    thu_boi uuid
);


ALTER TABLE public.hoa_don OWNER TO postgres;

--
-- Name: hoa_don_chi_tiet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hoa_don_chi_tiet (
    id bigint NOT NULL,
    hoa_don_id uuid NOT NULL,
    mo_ta character varying(300) NOT NULL,
    don_gia bigint NOT NULL,
    so_luong integer DEFAULT 1 NOT NULL,
    thanh_tien bigint NOT NULL,
    dich_vu_id uuid
);


ALTER TABLE public.hoa_don_chi_tiet OWNER TO postgres;

--
-- Name: hoa_don_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hoa_don_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hoa_don_chi_tiet_id_seq OWNER TO postgres;

--
-- Name: hoa_don_chi_tiet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hoa_don_chi_tiet_id_seq OWNED BY public.hoa_don_chi_tiet.id;


--
-- Name: khach_hang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khach_hang (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    ngay_sinh date,
    gioi_tinh character varying(10),
    dia_chi text,
    hang_khach_hang character varying(20) DEFAULT 'thuong'::character varying NOT NULL,
    preferred_ktv_id uuid,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    so_cccd character varying(20)
);


ALTER TABLE public.khach_hang OWNER TO postgres;

--
-- Name: lich_dat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_dat (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_lich_dat character varying(20) NOT NULL,
    khach_hang_id uuid,
    ho_ten_khach character varying(150),
    so_dien_thoai character varying(20),
    gioi_tinh_khach character varying(10),
    dich_vu_id uuid,
    ky_thuat_vien_id uuid,
    phong_id bigint,
    ngay_gio_bat_dau timestamp without time zone NOT NULL,
    ngay_gio_ket_thuc timestamp without time zone NOT NULL,
    ly_do_kham text,
    anh_dinh_kem_url text,
    trang_thai character varying(30) DEFAULT 'cho_xac_nhan'::character varying NOT NULL,
    dang_ky_goi_id uuid,
    ghi_chu_dat_lich text,
    ghi_chu_noi_bo text,
    thoi_gian_checkin timestamp without time zone,
    thoi_gian_huy timestamp without time zone,
    ly_do_huy text,
    nguoi_tao character varying(20) DEFAULT 'khach_hang'::character varying NOT NULL,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    chan_doan text,
    chong_chi_dinh text,
    khuyen_nghi_dich_vu_id uuid,
    khuyen_nghi_goi_id uuid
);


ALTER TABLE public.lich_dat OWNER TO postgres;

--
-- Name: lich_dieu_tri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_dieu_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khach_hang_id uuid NOT NULL,
    loai_dieu_tri character varying(20) NOT NULL,
    dich_vu_id uuid,
    goi_dich_vu_id uuid,
    tong_so_buoi integer NOT NULL,
    so_buoi_da_dung integer DEFAULT 0 NOT NULL,
    trang_thai character varying(20) DEFAULT 'dang_dieu_tri'::character varying NOT NULL,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    ma_lich_dieu_tri character varying(20),
    phong_id bigint,
    ho_ten_khach character varying(150),
    so_dien_thoai character varying(20),
    ghi_chu_noi_bo text,
    lich_dat_id uuid,
    ngay_bat_dau timestamp without time zone,
    ngay_ket_thuc timestamp without time zone
);


ALTER TABLE public.lich_dieu_tri OWNER TO postgres;

--
-- Name: lich_lam_viec; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_lam_viec (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    ngay date NOT NULL,
    gio_bat_dau time without time zone NOT NULL,
    gio_ket_thuc time without time zone NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying
);


ALTER TABLE public.lich_lam_viec OWNER TO postgres;

--
-- Name: nguoi_dung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nguoi_dung (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ho_ten character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    so_dien_thoai character varying(20),
    mat_khau_hash character varying(255) NOT NULL,
    vai_tro_id smallint NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    da_xac_thuc_email boolean DEFAULT false NOT NULL,
    avatar_url text,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    lan_dang_nhap_cuoi timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.nguoi_dung OWNER TO postgres;

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: phong; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phong (
    id bigint NOT NULL,
    ten_phong character varying(100) NOT NULL,
    ma_phong character varying(20) NOT NULL,
    loai_phong character varying(100),
    loai_dich_vu_ho_tro jsonb,
    thiet_bi jsonb,
    mo_ta text,
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    tang character varying(20)
);


ALTER TABLE public.phong OWNER TO postgres;

--
-- Name: phong_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phong_dich_vu (
    id bigint NOT NULL,
    phong_id bigint NOT NULL,
    danh_muc_id bigint NOT NULL
);


ALTER TABLE public.phong_dich_vu OWNER TO postgres;

--
-- Name: phong_dich_vu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phong_dich_vu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.phong_dich_vu_id_seq OWNER TO postgres;

--
-- Name: phong_dich_vu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phong_dich_vu_id_seq OWNED BY public.phong_dich_vu.id;


--
-- Name: phong_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phong_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.phong_id_seq OWNER TO postgres;

--
-- Name: phong_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phong_id_seq OWNED BY public.phong.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: system_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_audit_log (
    id bigint NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    payload text,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_audit_log OWNER TO postgres;

--
-- Name: system_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_audit_log_id_seq OWNER TO postgres;

--
-- Name: system_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_audit_log_id_seq OWNED BY public.system_audit_log.id;


--
-- Name: thanh_toan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thanh_toan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_giao_dich character varying(50) NOT NULL,
    hoa_don_id uuid NOT NULL,
    so_tien bigint NOT NULL,
    phuong_thuc character varying(20) NOT NULL,
    trang_thai character varying(20) DEFAULT 'cho_xu_ly'::character varying NOT NULL,
    ma_tham_chieu character varying(100),
    nguoi_thu_tien_id uuid,
    thoi_gian_giao_dich timestamp without time zone DEFAULT now() NOT NULL,
    ghi_chu text
);


ALTER TABLE public.thanh_toan OWNER TO postgres;

--
-- Name: thiet_bi_y_te; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thiet_bi_y_te (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_thiet_bi character varying(20) NOT NULL,
    ten_thiet_bi character varying(100) NOT NULL,
    loai_thiet_bi character varying(100),
    ngay_mua date,
    ngay_bao_tri_tiep_theo date,
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    phong_id_hien_tai bigint,
    ghi_chu text,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.thiet_bi_y_te OWNER TO postgres;

--
-- Name: vai_tro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vai_tro (
    id smallint NOT NULL,
    ma_vai_tro character varying(20) NOT NULL,
    ten_hien_thi character varying(50) NOT NULL,
    mo_ta_quyen text
);


ALTER TABLE public.vai_tro OWNER TO postgres;

--
-- Name: vai_tro_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vai_tro_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vai_tro_id_seq OWNER TO postgres;

--
-- Name: vai_tro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vai_tro_id_seq OWNED BY public.vai_tro.id;


--
-- Name: voucher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voucher (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_voucher character varying(50) NOT NULL,
    ten_chien_dich character varying(200),
    loai_giam character varying(20) NOT NULL,
    gia_tri_giam bigint NOT NULL,
    giam_toi_da bigint,
    don_hang_toi_thieu bigint DEFAULT 0 NOT NULL,
    ap_dung_cho character varying(30) DEFAULT 'tat_ca'::character varying NOT NULL,
    so_luong_toi_da integer,
    so_luong_da_dung integer DEFAULT 0 NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_het_han date,
    tao_boi uuid NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.voucher OWNER TO postgres;

--
-- Name: danh_muc_dich_vu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_muc_dich_vu ALTER COLUMN id SET DEFAULT nextval('public.danh_muc_dich_vu_id_seq'::regclass);


--
-- Name: goi_dich_vu_chi_tiet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet ALTER COLUMN id SET DEFAULT nextval('public.goi_dich_vu_chi_tiet_id_seq'::regclass);


--
-- Name: hoa_don_chi_tiet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet ALTER COLUMN id SET DEFAULT nextval('public.hoa_don_chi_tiet_id_seq'::regclass);


--
-- Name: phong id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong ALTER COLUMN id SET DEFAULT nextval('public.phong_id_seq'::regclass);


--
-- Name: phong_dich_vu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu ALTER COLUMN id SET DEFAULT nextval('public.phong_dich_vu_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: system_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log ALTER COLUMN id SET DEFAULT nextval('public.system_audit_log_id_seq'::regclass);


--
-- Name: vai_tro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro ALTER COLUMN id SET DEFAULT nextval('public.vai_tro_id_seq'::regclass);


--
-- Data for Name: buoi_tri_lieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buoi_tri_lieu (id, lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, danh_gia_truoc_buoi, danh_gia_sau_buoi, danh_gia_hieu_qua, so_thu_tu_buoi, danh_gia_id, trang_thai, canh_bao_dac_biet, ai_tom_tat_ngan, thoi_gian_ghi_chu) FROM stdin;
801cf2aa-3d85-4e33-a183-ea221c53014a	c9c877ff-87bb-4ea9-b61e-323224651d07	ebad6a02-acf6-4e99-b389-e7417aed42fd	36b8717c-a480-41a6-9e22-762a820813d0	1	154a8e29-4375-4b40-8248-6eb1d9bf8302	2026-05-18 08:30:00	2026-05-18 09:30:00	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
f918c774-0a69-48a3-8ef1-3780d073b4b5	91ddb47f-13dc-4566-9b1f-431b1aa86316	ebad6a02-acf6-4e99-b389-e7417aed42fd	36b8717c-a480-41a6-9e22-762a820813d0	1	154a8e29-4375-4b40-8248-6eb1d9bf8302	2026-05-18 11:30:00	2026-05-18 12:30:00	\N	\N	\N	\N	\N	cho_xac_nhan	\N	\N	\N
d60f42e2-64ec-4a5e-8cb2-87f2b8703d05	e877ee2a-eae8-4db6-b2cc-689ad48e8d85	ebad6a02-acf6-4e99-b389-e7417aed42fd	36b8717c-a480-41a6-9e22-762a820813d0	\N	154a8e29-4375-4b40-8248-6eb1d9bf8302	2026-05-18 10:00:00	2026-05-18 11:00:00	\N	\N	\N	\N	\N	dang_thuc_hien	\N	\N	\N
3e37549d-c965-4ed8-bab0-9ed0241a69c0	4659faa8-f494-40da-98f0-74dcbde77153	ebad6a02-acf6-4e99-b389-e7417aed42fd	ae65c69f-ea19-4cbe-bddc-38eecca4495f	4	154a8e29-4375-4b40-8248-6eb1d9bf8302	2026-05-18 21:00:00	2026-05-18 22:00:00	\N	\N	\N	\N	\N	dang_thuc_hien	\N	\N	\N
\.


--
-- Data for Name: chuyen_gia_y_te; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chuyen_gia_y_te (id, nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem, chung_chi, mo_ta_ban_than, anh_dai_dien_url, trang_thai, ngay_vao_lam) FROM stdin;
bbddd26c-700a-41c5-ab2c-cc1051911f47	0250bbb4-a4dc-421a-a7cd-fd7da961748b	BS001	B├íc s─⌐ chuy├¬n khoa	10	\N	\N	\N	hoat_dong	\N
36b8717c-a480-41a6-9e22-762a820813d0	05c8a4e8-4ebd-4974-b7e9-325324414395	KTV001	Vß║¡t l├╜ trß╗ï liß╗çu	8	\N	\N	\N	hoat_dong	\N
f867e1c4-6eea-4714-8941-488f121dacf1	79cf2eff-0b19-4829-a697-65fc7bc676a7	KTV002	Vß║¡t l├╜ trß╗ï liß╗çu	10	\N	\N	\N	hoat_dong	\N
42d55ee3-96d8-420d-aa5a-16063ed261d0	135e293c-e751-4cdf-89f0-2af7a8b656b2	KTV003	Vß║¡t l├╜ trß╗ï liß╗çu	8	\N	\N	\N	hoat_dong	\N
c3af34dc-cabc-4c33-9f50-c10903e203b4	eaeafae8-e27c-41b8-bcfa-c3ea47de81e7	KTV004	Vß║¡t l├╜ trß╗ï liß╗çu	8	\N	\N	\N	hoat_dong	\N
ae65c69f-ea19-4cbe-bddc-38eecca4495f	fd55d5b3-c0bf-49c3-9ac4-36a22becf3c9	KTV005	Vß║¡t l├╜ trß╗ï liß╗çu	4	\N	\N	\N	hoat_dong	\N
\.


--
-- Data for Name: danh_gia_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_gia_dich_vu (id, buoi_tri_lieu_id, khach_hang_id, ky_thuat_vien_id, so_sao_tong, so_sao_ktv, nhan_xet, hieu_qua_dieu_tri, se_quay_lai, hien_thi_cong_khai, thoi_gian_danh_gia) FROM stdin;
\.


--
-- Data for Name: danh_muc_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_muc_dich_vu (id, ten_danh_muc, mo_ta, thu_tu_hien_thi, an_hien) FROM stdin;
1	Kh├ím & T╞░ vß║Ñn	Kh├ím l├óm s├áng v├á l╞░ß╗úng gi├í	0	t
2	Vß║¡t l├╜ trß╗ï liß╗çu	C├íc ph╞░╞íng ph├íp trß╗ï liß╗çu c╞í x╞░╞íng khß╗¢p	0	t
3	Phß╗Ñc hß╗ôi chß╗⌐c n─âng	Tß║¡p vß║¡n ─æß╗Öng phß╗Ñc hß╗ôi sau chß║Ñn th╞░╞íng	0	t
\.


--
-- Data for Name: dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dich_vu (id, danh_muc_id, ten_dich_vu, mo_ta_ngan, mo_ta_chi_tiet, thoi_luong_phut, don_gia, hinh_anh_url, trang_thai, thu_tu_hien_thi, thiet_bi_yeu_cau) FROM stdin;
3754d2b6-2c14-4fc3-8943-71bd329ba833	1	Kh├ím l╞░ß╗úng gi├í ban ─æß║ºu	\N	\N	30	300000	\N	hoat_dong	0	\N
154a8e29-4375-4b40-8248-6eb1d9bf8302	2	Si├¬u ├óm trß╗ï liß╗çu	\N	\N	45	250000	\N	hoat_dong	0	\N
6aee4fc3-911e-4825-bcc9-c469fd9b22e8	2	─Éiß╗çn xung trß╗ï liß╗çu	\N	\N	45	200000	\N	hoat_dong	0	\N
10c59f8c-5aa0-45aa-813e-322a779999a6	3	Tß║¡p vß║¡n ─æß╗Öng thß╗Ñ ─æß╗Öng	\N	\N	60	400000	\N	hoat_dong	0	\N
\.


--
-- Data for Name: goi_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goi_dich_vu (id, ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, chi_tiet_dich_vu, thoi_gian_tao, danh_muc_id) FROM stdin;
8d43093d-3d20-44a5-8eb0-e248b1c72371	Phß╗Ñc hß╗ôi Cß╗Öt sß╗æng Chuy├¬n s├óu	PKG-2024-001	Liß╗çu tr├¼nh chuy├¬n s├óu phß╗Ñc hß╗ôi tho├ít vß╗ï ─æ─⌐a ─æß╗çm v├á tho├íi h├│a cß╗Öt sß╗æng.	12	8500000	\N	3	t	hoat_dong	[{"so_buoi": 6, "dich_vu_id": "3754d2b6-2c14-4fc3-8943-71bd329ba833"}, {"so_buoi": 6, "dich_vu_id": "154a8e29-4375-4b40-8248-6eb1d9bf8302"}]	2026-05-17 08:52:14.803718	\N
936b9218-c5f1-4568-a3c3-50fb86fd191a	Trß╗ï liß╗çu Thß╗â thao Cß║Ñp tß╗æc	PKG-2024-002	G├│i phß╗Ñc hß╗ôi chß║Ñn th╞░╞íng c─âng c╞í, bong g├ón cß║Ñp tß╗æc cho vß║¡n ─æß╗Öng vi├¬n.	6	4200000	\N	1	t	hoat_dong	[{"so_buoi": 2, "dich_vu_id": "154a8e29-4375-4b40-8248-6eb1d9bf8302"}, {"so_buoi": 2, "dich_vu_id": "6aee4fc3-911e-4825-bcc9-c469fd9b22e8"}, {"so_buoi": 2, "dich_vu_id": "10c59f8c-5aa0-45aa-813e-322a779999a6"}]	2026-05-17 08:52:14.803718	\N
20d46f93-cc14-4826-822b-a995720ec63b	Liß╗çu tr├¼nh Yoga Phß╗Ñc hß╗ôi	PKG-2024-003	Kß║┐t hß╗úp vß║¡t l├╜ trß╗ï liß╗çu v├á Yoga c├í nh├ón ─æß╗â phß╗Ñc hß╗ôi to├án diß╗çn v├á l├óu d├ái.	24	15000000	\N	6	f	hoat_dong	[{"so_buoi": 12, "dich_vu_id": "3754d2b6-2c14-4fc3-8943-71bd329ba833"}, {"so_buoi": 12, "dich_vu_id": "6aee4fc3-911e-4825-bcc9-c469fd9b22e8"}]	2026-05-17 08:52:14.803718	\N
\.


--
-- Data for Name: goi_dich_vu_chi_tiet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goi_dich_vu_chi_tiet (id, goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi) FROM stdin;
\.


--
-- Data for Name: hoa_don; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hoa_don (id, ma_hoa_don, khach_hang_id, loai_hoa_don, lich_dat_id, dang_ky_goi_id, tong_tien_truoc_giam, so_tien_giam, tong_tien_thanh_toan, da_thanh_toan, trang_thai, ghi_chu, ngay_tao, ngay_thanh_toan, thu_boi) FROM stdin;
\.


--
-- Data for Name: hoa_don_chi_tiet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hoa_don_chi_tiet (id, hoa_don_id, mo_ta, don_gia, so_luong, thanh_tien, dich_vu_id) FROM stdin;
\.


--
-- Data for Name: khach_hang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khach_hang (id, nguoi_dung_id, ngay_sinh, gioi_tinh, dia_chi, hang_khach_hang, preferred_ktv_id, thoi_gian_tao, deleted_at, so_cccd) FROM stdin;
ebad6a02-acf6-4e99-b389-e7417aed42fd	7c8fd333-03f1-4bbb-bf66-d1b94e7c63e0	1979-05-29	nam	\N	bac	\N	2026-05-17 08:52:14.629733	\N	\N
b1a276e4-8610-4ad1-968b-577633e14d6d	b7597d48-e2a3-4063-8d90-4e98cfc484aa	1976-11-06	nu	\N	vang	\N	2026-05-17 08:52:14.639888	\N	\N
3d09ebcf-0c52-4e5e-b4bf-7552746d2208	30d6304e-27ea-470a-b3c8-f17c2025a574	1992-04-25	nu	\N	bac	\N	2026-05-17 08:52:14.647844	\N	\N
76a56982-5608-4b4e-99db-deb5bab63fae	c74c9083-bda6-4563-95c1-b76af3f91a8a	2005-04-28	nam	\N	vang	\N	2026-05-17 08:52:14.655554	\N	\N
4050e15b-42be-4a5e-9d3b-4c8f1eadc950	3248a197-1f01-4e23-89c0-403ccae7a20a	2006-07-28	nam	\N	thuong	\N	2026-05-17 08:52:14.662873	\N	\N
458db606-8684-43ca-8c5c-603318845a77	669401f3-adcf-4cb4-8601-20ac794484df	1998-05-16	nu	\N	bac	\N	2026-05-17 08:52:14.671206	\N	\N
b6c148d4-839f-4f53-aa30-38c068d5c31e	c9dcc3ca-66db-40c8-ba3f-486104b4d3af	1997-09-22	nam	\N	bac	\N	2026-05-17 08:52:14.678288	\N	\N
55cdb808-9783-4b00-a8a4-4521fd7ca97c	f2e620a0-57e5-4263-b08f-772e1c70f285	1998-10-23	nu	\N	thuong	\N	2026-05-17 08:52:14.684665	\N	\N
f8ddd38b-c2c7-471a-9b1d-18814db160f1	518248c8-aeaf-440a-8839-70ebf2669c05	1976-11-06	nu	\N	thuong	\N	2026-05-17 08:52:14.692526	\N	\N
f40e0ce0-4f53-48ca-a7f0-cb04a8f88ef2	a10b3576-7099-45ce-92ce-dd6efb9c642f	1994-02-06	nam	\N	bac	\N	2026-05-17 08:52:14.700305	\N	\N
6c57294f-bb77-4581-a83a-2fafced3ede4	b3675cda-9dc0-4116-8a41-07ddb781df74	1983-08-15	nam	\N	bac	\N	2026-05-17 08:52:14.709031	\N	\N
dfc9fe76-35b3-4a3e-99a9-c297cd291539	4b7ef0ce-7a15-405e-9ec1-ae4b62d47efd	1976-08-12	nu	\N	vang	\N	2026-05-17 08:52:14.716555	\N	\N
900f41db-0391-4157-9680-fa845cccc3e2	1c6d4988-abed-48ab-b4a9-8d57ddc402e3	1963-11-08	nam	\N	bac	\N	2026-05-17 08:52:14.723382	\N	\N
05443f2f-b24f-4f34-abcc-e71db77f0afe	d955f8aa-6664-4919-917b-9fd5df464724	1969-05-27	nu	\N	vang	\N	2026-05-17 08:52:14.731286	\N	\N
4b55f622-2964-4427-9ea6-9a28e8c46fe1	c6787800-707e-4975-a44e-105fffcd0b8c	1989-08-30	nam	\N	thuong	\N	2026-05-17 08:52:14.738826	\N	\N
21c1d5ca-be14-4b24-b212-774cb2714684	6eaefb2c-fcb7-458a-ae9d-1c85a5c426c9	1965-05-20	nu	\N	thuong	\N	2026-05-17 08:52:14.746343	\N	\N
a0b206f0-3588-42f9-9c57-11c00ccdf606	51951f5e-0543-4ab1-8816-71fb956c8fa9	1994-11-22	nu	\N	thuong	\N	2026-05-17 08:52:14.753876	\N	\N
0d6b967e-701c-4c72-98e7-4756d392284e	2711876e-3774-43c1-acf0-55676e4c358b	1973-07-16	nam	\N	thuong	\N	2026-05-17 08:52:14.761683	\N	\N
3707ac24-4466-4881-bc01-b2acd9b82b53	250178d8-962d-4fee-87d6-0f5d7f2d2a93	2003-12-18	nu	\N	bac	\N	2026-05-17 08:52:14.769599	\N	\N
f7feae2b-f3da-4b19-92b2-12a2a6771abf	f7dcaa68-ac32-418e-9586-31c1819fc7c3	1993-02-18	nam	\N	thuong	\N	2026-05-17 08:52:14.777334	\N	\N
\.


--
-- Data for Name: lich_dat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url, trang_thai, dang_ky_goi_id, ghi_chu_dat_lich, ghi_chu_noi_bo, thoi_gian_checkin, thoi_gian_huy, ly_do_huy, nguoi_tao, thoi_gian_tao, chan_doan, chong_chi_dinh, khuyen_nghi_dich_vu_id, khuyen_nghi_goi_id) FROM stdin;
bf30d9d8-c081-4a63-9a7d-6580c983077a	LD-08H00	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 08:00:00	2026-05-18 08:30:00	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	\N	system	2026-05-18 20:08:46.882841	─Éau cß╗ò vai g├íy (Ca 1).	Kh├┤ng xoa b├│p mß║ính.	154a8e29-4375-4b40-8248-6eb1d9bf8302	\N
e37c7727-d4cf-40c0-ac86-f6d9d8ae2b1d	LD-09H30	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 09:30:00	2026-05-18 10:00:00	\N	\N	cho_xac_nhan	\N	\N	\N	\N	\N	\N	system	2026-05-18 20:08:46.882841	\N	\N	\N	\N
9d522575-45da-4b46-b7d0-60fb836e487a	LD-11H00	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 11:00:00	2026-05-18 11:30:00	\N	\N	da_checkin	\N	\N	\N	\N	\N	\N	system	2026-05-18 20:08:46.882841	C─âng c╞í l╞░ng d╞░ß╗¢i.	Ch├║ ├╜ huyß╗çt ─æß║ío.	\N	8d43093d-3d20-44a5-8eb0-e248b1c72371
81c07258-4610-4126-9a39-8bf03794d508	LD-14H00	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 14:00:00	2026-05-18 14:30:00	\N	\N	da_huy	\N	\N	\N	\N	\N	Kh├ích h├áng bß║¡n ─æß╗Öt xuß║Ñt.	system	2026-05-18 20:08:46.882841	\N	\N	\N	\N
4de69818-84d9-469f-826e-38a2cefe88d0	LD-15H30	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 15:30:00	2026-05-18 16:00:00	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	\N	system	2026-05-18 20:08:46.882841	C╞í thß╗â khß╗Åe mß║ính, chß╗ë mß╗Åi nhß║╣.	Kh├┤ng c├│.	\N	\N
0ce78623-0489-4758-885e-95e8cd8f47bd	LD-18H00	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 18:00:00	2026-05-18 18:30:00	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	\N	system	2026-05-18 20:08:46.882841	Tho├íi h├│a khß╗¢p.	\N	\N	8d43093d-3d20-44a5-8eb0-e248b1c72371
733812be-49a1-44cc-aea3-f3cbbe312f34	LD-20H00	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 20:00:00	2026-05-18 20:30:00	\N	\N	cho_xac_nhan	\N	\N	\N	\N	\N	\N	system	2026-05-18 20:08:46.882841	Nhß╗⌐c mß╗Åi tay.	Kh├┤ng.	154a8e29-4375-4b40-8248-6eb1d9bf8302	\N
6275bb19-02b4-445c-a63d-9adf13180270	LD-21H00	ebad6a02-acf6-4e99-b389-e7417aed42fd	Th├ánh Sang Ho├áng	0242 3920 4622	\N	3754d2b6-2c14-4fc3-8943-71bd329ba833	bbddd26c-700a-41c5-ab2c-cc1051911f47	1	2026-05-18 21:00:00	2026-05-18 21:30:00	\N	\N	cho_xac_nhan	\N	\N	\N	\N	\N	\N	system	2026-05-18 20:08:46.882841	C─âng thß║│ng d├óy thß║ºn kinh.	─Éo huyß║┐t ├íp.	\N	8d43093d-3d20-44a5-8eb0-e248b1c72371
\.


--
-- Data for Name: lich_dieu_tri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_dieu_tri (id, khach_hang_id, loai_dieu_tri, dich_vu_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, thoi_gian_tao, ma_lich_dieu_tri, phong_id, ho_ten_khach, so_dien_thoai, ghi_chu_noi_bo, lich_dat_id, ngay_bat_dau, ngay_ket_thuc) FROM stdin;
c9c877ff-87bb-4ea9-b61e-323224651d07	ebad6a02-acf6-4e99-b389-e7417aed42fd	dich_vu_le	154a8e29-4375-4b40-8248-6eb1d9bf8302	\N	1	0	dang_dieu_tri	2026-05-18 20:08:46.882841	\N	\N	\N	\N	\N	bf30d9d8-c081-4a63-9a7d-6580c983077a	2026-05-18 08:30:00	2026-05-18 09:30:00
91ddb47f-13dc-4566-9b1f-431b1aa86316	ebad6a02-acf6-4e99-b389-e7417aed42fd	theo_goi	\N	8d43093d-3d20-44a5-8eb0-e248b1c72371	5	0	dang_dieu_tri	2026-05-18 20:08:46.882841	\N	\N	\N	\N	\N	9d522575-45da-4b46-b7d0-60fb836e487a	2026-05-18 11:30:00	2026-05-18 12:30:00
e877ee2a-eae8-4db6-b2cc-689ad48e8d85	ebad6a02-acf6-4e99-b389-e7417aed42fd	dich_vu_le	154a8e29-4375-4b40-8248-6eb1d9bf8302	\N	1	0	dang_dieu_tri	2026-05-18 20:17:54.910889	\N	\N	\N	\N	\N	bf30d9d8-c081-4a63-9a7d-6580c983077a	\N	\N
4659faa8-f494-40da-98f0-74dcbde77153	ebad6a02-acf6-4e99-b389-e7417aed42fd	dich_vu_le	154a8e29-4375-4b40-8248-6eb1d9bf8302	\N	1	0	dang_dieu_tri	2026-05-18 20:20:02.916965	\N	\N	\N	\N	\N	bf30d9d8-c081-4a63-9a7d-6580c983077a	\N	\N
\.


--
-- Data for Name: lich_lam_viec; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_lam_viec (id, nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) FROM stdin;
2deca607-ebe5-4d1e-8730-aeed6abc612d	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-11	08:00:00	17:00:00	hoat_dong
95ed0225-62c1-4fe8-a11f-ad4d829bed11	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-12	08:00:00	17:00:00	hoat_dong
b784cd17-b251-4719-8b36-7481858a7351	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-13	08:00:00	17:00:00	hoat_dong
67529f22-ace6-4407-8063-ec8e21f85713	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-14	08:00:00	17:00:00	hoat_dong
0b6f2b80-c17a-4248-b94f-0c251389fdf1	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-15	08:00:00	17:00:00	hoat_dong
8d7d68ed-3f0b-4c4e-b1df-270025652ed2	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-16	08:00:00	12:00:00	hoat_dong
f3b6ad55-c013-4648-8df0-d346f4d70055	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-11	08:30:00	12:00:00	hoat_dong
4a9a16e1-6ebf-4392-ad6e-b534dca30a6b	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-12	08:30:00	12:00:00	hoat_dong
265dd540-86cb-4f15-b21e-f4e92be93706	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-13	08:30:00	12:00:00	hoat_dong
0b031cd8-be8e-493c-bdbf-a5cbd7dabd86	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-14	13:30:00	17:30:00	hoat_dong
ff7b8342-c6be-40a6-b64c-f65e4725f522	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-15	13:30:00	17:30:00	hoat_dong
0c34e31b-5736-49b0-873c-f195085b8d81	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-16	13:30:00	17:30:00	hoat_dong
a6979308-78b5-44cd-887d-fd36e23964dd	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-11	13:00:00	17:00:00	hoat_dong
2d3f6b62-202f-4ce2-8702-14dadd967489	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-12	13:00:00	17:00:00	hoat_dong
ec1b8644-c4c6-47db-95d7-609c9c60b13d	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-13	13:00:00	17:00:00	hoat_dong
cb28bb60-9d25-4876-b944-f9dceceb6d1d	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-14	13:00:00	17:00:00	hoat_dong
85dca913-225b-4ce6-846a-2eb7392da9a6	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-15	13:00:00	17:00:00	hoat_dong
ea202c50-40b9-4797-bc7e-9055e667f6af	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-11	08:00:00	12:00:00	hoat_dong
e40b11b4-3473-49e7-8eda-26f31b93b55f	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-12	08:00:00	12:00:00	hoat_dong
b1cafaf7-f748-42e9-967c-1dde405a34e0	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-13	08:00:00	12:00:00	hoat_dong
ab52af2c-fcf1-4c14-87b3-b70b9c5e03cf	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-14	13:00:00	17:00:00	hoat_dong
40c2fe45-7aad-4cc0-bfb6-c9ff58c1c796	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-15	13:00:00	17:00:00	hoat_dong
24c258b2-339a-4fb0-bcd8-c637a795c547	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-11	13:00:00	17:00:00	hoat_dong
430a6f1c-d49d-42d1-b9ce-465b7b50d65f	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-12	13:00:00	17:00:00	hoat_dong
f77fed93-9084-400d-9494-05f552677420	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-16	13:00:00	17:00:00	hoat_dong
49dde301-156c-4383-ab6f-67f2560fea64	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-13	08:00:00	17:00:00	tam_nghi
ee881236-de83-4903-b1ab-bf5ad66d2136	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-14	08:00:00	17:00:00	tam_nghi
5bd65a3e-4652-4f91-9b32-8fb979f114de	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-18	08:00:00	17:00:00	hoat_dong
91a995ce-c0b0-48d8-95dc-8bfdcdf2c82d	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-19	08:00:00	17:00:00	hoat_dong
e25ec0bb-f787-4f92-a38d-b85c3850b8d3	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-21	08:00:00	17:00:00	hoat_dong
01675e99-157f-437b-a7db-470f858b94b3	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-22	08:00:00	17:00:00	hoat_dong
47162b01-b8c2-4e02-8f04-b2c6e717516b	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-20	08:00:00	17:00:00	tam_nghi
5f4d495a-c237-4bda-9315-7964f66930ff	ce02a792-b7f6-4654-8452-1ac904ce48fc	2026-05-23	17:00:00	21:00:00	hoat_dong
2debe8b0-98e7-4e5d-9454-746efda76afc	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-18	08:30:00	12:00:00	hoat_dong
72f7b49c-dc20-4eef-a185-53d6594c4da5	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-20	08:30:00	12:00:00	hoat_dong
6ce66433-ab01-4e02-a856-970d040d06c1	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-22	08:30:00	12:00:00	hoat_dong
7736f872-21db-44d8-9439-0adddab8666e	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-19	17:30:00	21:30:00	hoat_dong
32d6702d-f0d1-4fae-befc-c0c757c62322	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-21	17:30:00	21:30:00	hoat_dong
71834a08-6576-4b13-92c0-2e667f90ac70	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-18	17:00:00	21:00:00	hoat_dong
08e89d42-ee1c-4a1b-9bed-351e2be6861e	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-19	17:00:00	21:00:00	hoat_dong
05ff0219-dd78-4267-a209-74241e308240	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-20	17:00:00	21:00:00	hoat_dong
044f3671-baa4-4eb2-9c51-e8b3b7bdaa70	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-21	17:00:00	21:00:00	hoat_dong
bba9f117-7ff2-4271-81e7-5e6416ef6c1e	05c8a4e8-4ebd-4974-b7e9-325324414395	2026-05-22	17:00:00	21:00:00	hoat_dong
6dc73776-671f-41cf-b2ee-0b8dba2dc3ef	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-18	08:00:00	12:00:00	hoat_dong
b3b4296f-822d-4771-9163-0e75b34e74c4	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-20	08:00:00	12:00:00	hoat_dong
f927725a-8d94-4658-bb2e-b68b8e23fd54	79cf2eff-0b19-4829-a697-65fc7bc676a7	2026-05-22	08:00:00	12:00:00	hoat_dong
e0bee517-6a78-48d3-8b1d-7818b6468908	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-18	08:00:00	12:00:00	hoat_dong
84460c9f-6773-4055-a4a3-ffe788cf883c	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-19	08:00:00	12:00:00	hoat_dong
fc365d91-d88d-413b-bdbd-759704032fe4	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-20	08:00:00	12:00:00	hoat_dong
68fa1f90-8f9f-4acc-a283-8607b322b53f	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-21	08:00:00	12:00:00	hoat_dong
6ae4f993-055b-4540-ab1a-8451003788d7	135e293c-e751-4cdf-89f0-2af7a8b656b2	2026-05-22	08:00:00	12:00:00	hoat_dong
1661bb91-733c-40d3-a1d4-2ded067ddb5f	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-17	08:00:00	17:00:00	hoat_dong
fc849c87-ec5b-4d9a-9a44-5f2066727397	0250bbb4-a4dc-421a-a7cd-fd7da961748b	2026-05-23	08:00:00	17:00:00	hoat_dong
\.


--
-- Data for Name: nguoi_dung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nguoi_dung (id, ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email, avatar_url, thoi_gian_tao, lan_dang_nhap_cuoi, deleted_at) FROM stdin;
ce02a792-b7f6-4654-8452-1ac904ce48fc	Lß╗à t├ón 1	letan@officecare.com	0901234568	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	2	hoat_dong	t	\N	2026-05-17 08:52:14.582593	\N	\N
0250bbb4-a4dc-421a-a7cd-fd7da961748b	BS Trß║ºn V─ân Kh├ím	bacsi@officecare.com	0901234569	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	4	hoat_dong	t	\N	2026-05-17 08:52:14.585492	\N	\N
05c8a4e8-4ebd-4974-b7e9-325324414395	KTV ─Éß╗ïnh Lß╗▒c Phß║ím	ktv1@officecare.com	023 2920 8960	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	3	hoat_dong	t	\N	2026-05-17 08:52:14.593009	\N	\N
79cf2eff-0b19-4829-a697-65fc7bc676a7	KTV V├ón Linh Tr╞░╞íng	ktv2@officecare.com	024 4031 7601	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	3	hoat_dong	t	\N	2026-05-17 08:52:14.60038	\N	\N
135e293c-e751-4cdf-89f0-2af7a8b656b2	KTV ├üi Thi Phan	ktv3@officecare.com	0268 2062 9452	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	3	hoat_dong	t	\N	2026-05-17 08:52:14.606089	\N	\N
eaeafae8-e27c-41b8-bcfa-c3ea47de81e7	KTV ─É├¼nh Ph├║c D╞░╞íng	ktv4@officecare.com	0278 6429 1560	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	3	hoat_dong	t	\N	2026-05-17 08:52:14.610639	\N	\N
fd55d5b3-c0bf-49c3-9ac4-36a22becf3c9	KTV Minh V╞░╞íng V╞░╞íng	ktv5@officecare.com	0224 7248 1060	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	3	hoat_dong	t	\N	2026-05-17 08:52:14.616126	\N	\N
7c8fd333-03f1-4bbb-bf66-d1b94e7c63e0	Th├ánh Sang Ho├áng	HuuVinh.Pham8@hotmail.com	0242 3920 4622	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.624142	\N	\N
b7597d48-e2a3-4063-8d90-4e98cfc484aa	Bß║úo Tr├ón Ng├┤	PhuongLoan_7koan@hotmail.com	024 0144 0095	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.636062	\N	\N
30d6304e-27ea-470a-b3c8-f17c2025a574	Nhß║¡t Nam T├┤	PhuongNam.Le14@hotmail.com	028 8156 1959	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.643918	\N	\N
c74c9083-bda6-4563-95c1-b76af3f91a8a	Ph├║ Hiß╗çp V┼⌐	KhacTrieu.Ho@gmail.com	0278 6182 4722	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.652182	\N	\N
3248a197-1f01-4e23-89c0-403ccae7a20a	V├ón Trinh V╞░╞íng	ThanhTuyet.Mai@gmail.com	029 5140 8352	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.659131	\N	\N
669401f3-adcf-4cb4-8601-20ac794484df	Thanh Yß║┐n ─Éinh	NguyenHanh.Lam77@yahoo.com	027 0476 1508	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.667433	\N	\N
c9dcc3ca-66db-40c8-ba3f-486104b4d3af	Thanh Trang B├╣i	TanThanh.Le@hotmail.com	023 9300 0643	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.674883	\N	\N
f2e620a0-57e5-4263-b08f-772e1c70f285	Nguyß╗çt ├ünh Ph├╣ng	MinhTrieu39@hotmail.com	021 9831 3625	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.681812	\N	\N
518248c8-aeaf-440a-8839-70ebf2669c05	Tiß╗âu My Ho├áng	7kacTrong67@gmail.com	026 7468 1675	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.688688	\N	\N
a10b3576-7099-45ce-92ce-dd6efb9c642f	Th├ánh Ph╞░╞íng Nguyß╗àn	TrucLam_Tran@gmail.com	0225 7190 3525	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.696522	\N	\N
b3675cda-9dc0-4116-8a41-07ddb781df74	Nam An L├¬	ThanhAn_7ko77@hotmail.com	0292 1713 0740	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.705117	\N	\N
4b7ef0ce-7a15-405e-9ec1-ae4b62d47efd	Ngß╗ìc Huyß╗ün Trß╗ïnh	ChiKien_Trinh@yahoo.com	0274 0497 5886	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.713106	\N	\N
1c6d4988-abed-48ab-b4a9-8d57ddc402e3	Tuß║Ñn Anh V┼⌐	VietHuy.7kang@yahoo.com	023 8243 5100	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.719616	\N	\N
d955f8aa-6664-4919-917b-9fd5df464724	Xu├ón Liß╗àu ─Éo├án	PhuongChau79@gmail.com	0272 5432 7653	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.727524	\N	\N
c6787800-707e-4975-a44e-105fffcd0b8c	Nghi Xu├ón Ph├╣ng	PhuongNam.Phung@gmail.com	0296 3758 8460	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.735098	\N	\N
6eaefb2c-fcb7-458a-ae9d-1c85a5c426c9	Anh Viß╗çt Phß║ím	HuongGiang_Phung@hotmail.com	025 0737 5565	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.742279	\N	\N
51951f5e-0543-4ab1-8816-71fb956c8fa9	Ngß╗ìc Khanh Ph├╣ng	7kinhNhan30@hotmail.com	0272 2579 6101	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.750625	\N	\N
2711876e-3774-43c1-acf0-55676e4c358b	Uyß╗ân Khanh L├╜	UyenNhu.Bui@gmail.com	025 1638 7054	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.75791	\N	\N
250178d8-962d-4fee-87d6-0f5d7f2d2a93	Xu├ón Thß║úo ─É├áo	ThanhKien_Ly@yahoo.com	023 0051 1660	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.765978	\N	\N
f7dcaa68-ac32-418e-9586-31c1819fc7c3	Thu V├ón L├╜	DuyThanh.Ha@yahoo.com	021 9127 1768	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	1	hoat_dong	t	\N	2026-05-17 08:52:14.774047	\N	\N
847466da-15de-40ae-96bd-579df84d3af5	Admin Master	admin@officecare.com	0901234567	$2b$10$qBldwPNGl7D2join3nPFN.UadkTzYcDSdbmCDjcfWuRGf6OlTcdOu	5	hoat_dong	t	\N	2026-05-17 08:52:14.57556	2026-05-18 20:19:12.525371	\N
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, email, otp, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: phong; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phong (id, ten_phong, ma_phong, loai_phong, loai_dich_vu_ho_tro, thiet_bi, mo_ta, trang_thai, tang) FROM stdin;
1	Ph├▓ng 101 - Kh├ím VIP 1	P101	kham_benh	\N	\N	\N	san_sang	Tang 1
2	Ph├▓ng 102 - Kh├ím tß╗òng qu├ít	P102	kham_benh	\N	\N	\N	san_sang	Tang 1
3	Ph├▓ng 201 - Trß╗ï liß╗çu Vß║¡t l├╜	P201	tri_lieu	\N	\N	\N	san_sang	Tang 2
4	Ph├▓ng 202 - ─Éiß╗çn xung trß╗ï liß╗çu	P202	tri_lieu	\N	\N	\N	san_sang	Tang 2
5	Ph├▓ng 203 - K├⌐o gi├ún cß╗Öt sß╗æng	P203	tri_lieu	\N	\N	\N	san_sang	Tang 2
6	Ph├▓ng 301 - Phß╗Ñc hß╗ôi chß╗⌐c n─âng	P301	phuc_hoi	\N	\N	\N	san_sang	Tang 3
\.


--
-- Data for Name: phong_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phong_dich_vu (id, phong_id, danh_muc_id) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, nguoi_dung_id, token, expires_at, created_at) FROM stdin;
1	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAwODEyNywiZXhwIjoxNzc5NjEyOTI3fQ.F2JxwZ7N9zR2ASgR9RNGYwifeLttcfnUVWdr4H3bzCo	2026-05-24 15:55:27.838	2026-05-17 08:55:27.841196
2	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAwOTAxNiwiZXhwIjoxNzc5NjEzODE2fQ.nwxVyqg_XZJNwTvGAE5pA7ttYzliaL8khY_c3_wJtqQ	2026-05-24 16:10:16.532	2026-05-17 09:10:16.533937
3	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAwOTYyMiwiZXhwIjoxNzc5NjE0NDIyfQ.GxVOodGRetzKaQaH9P7mMl9KSxDc6SL6P8D691ig4Kw	2026-05-24 16:20:22.826	2026-05-17 09:20:22.828852
4	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAxMjQ2NSwiZXhwIjoxNzc5NjE3MjY1fQ.VZC3YZzxDU3LEIzssOimAMVMiz_McyD_HXje-lvy6J0	2026-05-24 17:07:45.149	2026-05-17 10:07:45.150776
5	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAxMjYxOSwiZXhwIjoxNzc5NjE3NDE5fQ.iCfGpM1YNMxb6zucJkimkaj7WLkncWTj_fKT0-rYCXc	2026-05-24 17:10:19.495	2026-05-17 10:10:19.496241
6	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAxNDI0NywiZXhwIjoxNzc5NjE5MDQ3fQ.I5lALZRSyzBZuWuAf3kIqwHkQMt8nEhg-QaAiPo4SBU	2026-05-24 17:37:27.234	2026-05-17 10:37:27.235662
7	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAyODc3NywiZXhwIjoxNzc5NjMzNTc3fQ.gZmxFHiQPzbzfcoIJ_6qW1-7jNAzqE7MxUaW6ui7p2Y	2026-05-24 21:39:37.155	2026-05-17 14:39:37.156735
8	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAyOTkyMCwiZXhwIjoxNzc5NjM0NzIwfQ.cmZT6ffmZE9f58Cq0BNYN92sgDWt-aWfzKhbfb1JTA8	2026-05-24 21:58:40.389	2026-05-17 14:58:40.392049
9	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAzMTAwMSwiZXhwIjoxNzc5NjM1ODAxfQ.8TiYc9fzRU671vmfE8m8WUUHWYVSEXLbXqPTCi_N7L8	2026-05-24 22:16:41.648	2026-05-17 15:16:41.652663
10	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAzMjIzNiwiZXhwIjoxNzc5NjM3MDM2fQ.SlTfNocrjRDNblMrkdYldl0qGV6e36BvppBmuFpP2hk	2026-05-24 22:37:16.491	2026-05-17 15:37:16.492332
11	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAzMzQ0MywiZXhwIjoxNzc5NjM4MjQzfQ.6mbFKGtaGiy6dzZSUThHvhI04E6rYl4oNlG3gcoTgZQ	2026-05-24 22:57:23.898	2026-05-17 15:57:23.901142
12	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTAzMzgxNCwiZXhwIjoxNzc5NjM4NjE0fQ.w1StK8p-3JBLe4tpfy6cku5C_7F10C-fAi6owbmDoFM	2026-05-24 23:03:34.195	2026-05-17 16:03:34.198127
13	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA3Mzc1OCwiZXhwIjoxNzc5Njc4NTU4fQ.cGTG9B-jAgxbp5giM7m0xwD7CFh2TItWWctlr5mCPgQ	2026-05-25 10:09:18.235	2026-05-18 03:09:18.236921
14	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA3NjA4MCwiZXhwIjoxNzc5NjgwODgwfQ.iYvsFqcnLGBl8_B3MkW45ABuK9j_6734pv46CFM077o	2026-05-25 10:48:00.458	2026-05-18 03:48:00.46149
15	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA3OTA1NSwiZXhwIjoxNzc5NjgzODU1fQ.dw1yrCueFxj4VZdQwincBX-W7xVBdR13xC9Os5p621E	2026-05-25 11:37:35.361	2026-05-18 04:37:35.367805
16	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA3OTQxOCwiZXhwIjoxNzc5Njg0MjE4fQ.s60dKn2nwkhiF_4plSQyZwO8yRq3pugbvFYKFdHhXpY	2026-05-25 11:43:38.8	2026-05-18 04:43:38.803742
17	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA4MjI1MSwiZXhwIjoxNzc5Njg3MDUxfQ.XQssH4nOpuDHU6Xxbk4tSuIVVu7ATrEpfvH037PfP9g	2026-05-25 12:30:51.014	2026-05-18 05:30:51.015728
18	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA4MjkwMSwiZXhwIjoxNzc5Njg3NzAxfQ.l-JEEKbcmbQAjizd0p5BcI-qeDpYWMsuEKkoEv2hlrw	2026-05-25 12:41:41.715	2026-05-18 05:41:41.718857
19	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA4NDA0MCwiZXhwIjoxNzc5Njg4ODQwfQ.tj8DJArQLWLIxAcDSCeruZbn_oQ2rb_7ZcqCK7tBCzU	2026-05-25 13:00:40.342	2026-05-18 06:00:40.345163
20	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA4NDM0OCwiZXhwIjoxNzc5Njg5MTQ4fQ.9i07vrvcrlWFf4nzzkXflJ0rrH_oEpDDLa9Rr4Yzw3U	2026-05-25 13:05:48.964	2026-05-18 06:05:48.968219
21	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA4NDQ3NiwiZXhwIjoxNzc5Njg5Mjc2fQ.O8Fgi0Soxh_sXH4Il182OiZPooOYWZps-U37m8UBoKI	2026-05-25 13:07:56.288	2026-05-18 06:07:56.288275
22	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5MjExOSwiZXhwIjoxNzc5Njk2OTE5fQ.NzcVRqDFhm8vl_2vb3hkLhRspnh9S8l6h_Y1SsTW1BM	2026-05-25 15:15:19.208	2026-05-18 08:15:19.207661
23	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5MjE2OSwiZXhwIjoxNzc5Njk2OTY5fQ.os6jZMw1XswCN1XJBAX1kmg_M9FEhyD98QN_nFSqIgk	2026-05-25 15:16:09.288	2026-05-18 08:16:09.290594
24	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5MjMxMSwiZXhwIjoxNzc5Njk3MTExfQ._6758CbfRNbdAhZF49FjpN1YuMGqPqeJBpAxtXEutKQ	2026-05-25 15:18:31.868	2026-05-18 08:18:31.868228
25	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5MzI1OSwiZXhwIjoxNzc5Njk4MDU5fQ.uoXyjIDFCT0KuUvgOebFRqFagBNyBp98bpcKKDuaMko	2026-05-25 15:34:19.497	2026-05-18 08:34:19.500048
26	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5MzQ1NCwiZXhwIjoxNzc5Njk4MjU0fQ.Bp6vZ1uw7ySZ37SbZYunLSVbODMfHexmTJEHnfndv8U	2026-05-25 15:37:34.372	2026-05-18 08:37:34.375207
27	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5MzQ4MCwiZXhwIjoxNzc5Njk4MjgwfQ.Ch_qQGoX_G8iwX_3tmdFIW1q4moLq6_LSEfGpAmCJTk	2026-05-25 15:38:00.868	2026-05-18 08:38:00.869365
28	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5MzYyMCwiZXhwIjoxNzc5Njk4NDIwfQ.pbHDCP8mCvKu-jqoFcu6h3zzHzfGJ6bGV3UOUc0euQM	2026-05-25 15:40:20.493	2026-05-18 08:40:20.493647
29	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTA5NDc1OCwiZXhwIjoxNzc5Njk5NTU4fQ.UIZ6jiWJ7fPv_E4ljNo9_UrsNgjOH5qnMxRW2briB04	2026-05-25 15:59:18.674	2026-05-18 08:59:18.673731
30	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwNTMxMywiZXhwIjoxNzc5NzEwMTEzfQ.FqQDDCeF-fNwacJdOYalAhE0aDJYoPXajYGy3tTfinw	2026-05-25 18:55:13.795	2026-05-18 11:55:13.799245
31	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwNjI1NywiZXhwIjoxNzc5NzExMDU3fQ.7fsGMhQQO2HWXUHa3EeHU9OABiV39qjE1v29FFtFBbI	2026-05-25 19:10:57.869	2026-05-18 12:10:57.870302
32	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwNzM3NCwiZXhwIjoxNzc5NzEyMTc0fQ.fDM1pg0zV47RgrsbEq4o0eiGLT1CeyMnS76FQm19yAA	2026-05-25 19:29:34.569	2026-05-18 12:29:34.573412
33	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwNzgxMiwiZXhwIjoxNzc5NzEyNjEyfQ.CMO6UCwL8GFV4Bl1OzApMClInp79c4mnP8F6vdvkq74	2026-05-25 19:36:52.837	2026-05-18 12:36:52.840324
34	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwNzg0MCwiZXhwIjoxNzc5NzEyNjQwfQ.-F6woTtG63VVqfAY-PuQ2Z3UzeoLqrGv5ORTsjvdddk	2026-05-25 19:37:20.207	2026-05-18 12:37:20.209012
35	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwODI2OSwiZXhwIjoxNzc5NzEzMDY5fQ.5DbibIIEK-h_2CYcUvuc5FtF8BiELKeakaU19vs3c6k	2026-05-25 19:44:29.731	2026-05-18 12:44:29.732214
36	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwODYwMCwiZXhwIjoxNzc5NzEzNDAwfQ.l42yRLB8GHrVDU6kuI9uDMZ8z5qwYFUBoeP4iRWrhQw	2026-05-25 19:50:00.359	2026-05-18 12:50:00.360364
37	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTEwOTc3NiwiZXhwIjoxNzc5NzE0NTc2fQ.CnZwocy0IcTWiAfbpZzPAVZEr0kjZ7sw1dQxZkU3VQQ	2026-05-25 20:09:36.331	2026-05-18 20:09:36.33293
38	847466da-15de-40ae-96bd-579df84d3af5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NzQ2NmRhLTE1ZGUtNDBhZS05NmJkLTU3OWRmODRkM2FmNSIsImlhdCI6MTc3OTExMDM1MiwiZXhwIjoxNzc5NzE1MTUyfQ.0qsKZUrVgAaengg84puO7B9gZU4BArLM-oSwTqlc3xI	2026-05-25 20:19:12.516	2026-05-18 20:19:12.519532
\.


--
-- Data for Name: system_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_audit_log (id, user_id, action, entity_type, entity_id, payload, ip_address, created_at) FROM stdin;
1	847466da-15de-40ae-96bd-579df84d3af5	CREATE_SCHEDULE	SCHEDULE	1661bb91-733c-40d3-a1d4-2ded067ddb5f	{"nguoi_dung_id":"0250bbb4-a4dc-421a-a7cd-fd7da961748b","ngay":"2026-05-17","gio_bat_dau":"08:00","gio_ket_thuc":"17:00","trang_thai":"hoat_dong"}	::1	2026-05-17 14:45:57.852425
2	847466da-15de-40ae-96bd-579df84d3af5	CREATE_SCHEDULE	SCHEDULE	fc849c87-ec5b-4d9a-9a44-5f2066727397	{"nguoi_dung_id":"0250bbb4-a4dc-421a-a7cd-fd7da961748b","ngay":"2026-05-23","gio_bat_dau":"08:00","gio_ket_thuc":"17:00","trang_thai":"hoat_dong"}	::1	2026-05-18 08:19:48.320724
\.


--
-- Data for Name: thanh_toan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thanh_toan (id, ma_giao_dich, hoa_don_id, so_tien, phuong_thuc, trang_thai, ma_tham_chieu, nguoi_thu_tien_id, thoi_gian_giao_dich, ghi_chu) FROM stdin;
\.


--
-- Data for Name: thiet_bi_y_te; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thiet_bi_y_te (id, ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, ngay_bao_tri_tiep_theo, trang_thai, phong_id_hien_tai, ghi_chu, thoi_gian_tao) FROM stdin;
\.


--
-- Data for Name: vai_tro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vai_tro (id, ma_vai_tro, ten_hien_thi, mo_ta_quyen) FROM stdin;
1	khach_hang	Kh├ích h├áng	Xem lß╗ïch cß╗ºa m├¼nh, ─æß║╖t lß╗ïch, xem g├│i, gß╗¡i feedback
2	le_tan	Lß╗à t├ón	Quß║ún l├╜ lß╗ïch hß║╣n, check-in, tß║ío h├│a ─æ╞ín, thu tiß╗ün
4	bac_si	B├íc s─⌐	Quß║ún l├╜ ph├íc ─æß╗ô ─æiß╗üu trß╗ï, chß║⌐n ─æo├ín, xem hß╗ô s╞í bß╗çnh ├ín
5	admin	Quß║ún trß╗ï vi├¬n	To├án quyß╗ün hß╗ç thß╗æng
3	ky_thuat_vien	Chuy├¬n gia y tß║┐	Xem lß╗ïch cß╗ºa m├¼nh, tß║ío ─æ├ính gi├í, ghi ch├║ buß╗òi, ─æß╗ü xuß║Ñt g├│i
\.


--
-- Data for Name: voucher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voucher (id, ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, ap_dung_cho, so_luong_toi_da, so_luong_da_dung, ngay_bat_dau, ngay_het_han, tao_boi, trang_thai, thoi_gian_tao) FROM stdin;
1d06e7ba-8bd8-456a-b308-76356b3a71da	SUMMER2024	Khuyß║┐n m├úi H├¿ 2024	phan_tram	15	\N	500000	tat_ca	\N	0	2026-04-17	2026-06-17	847466da-15de-40ae-96bd-579df84d3af5	hoat_dong	2026-05-17 08:52:15.298938
70b8a251-4817-439d-8881-f457ee57ed09	NEWUSER	Kh├ích h├áng mß╗¢i	so_tien_co_dinh	100000	\N	0	tat_ca	\N	0	2025-05-17	2027-05-17	847466da-15de-40ae-96bd-579df84d3af5	hoat_dong	2026-05-17 08:52:15.298938
\.


--
-- Name: danh_muc_dich_vu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.danh_muc_dich_vu_id_seq', 3, true);


--
-- Name: goi_dich_vu_chi_tiet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goi_dich_vu_chi_tiet_id_seq', 1, false);


--
-- Name: hoa_don_chi_tiet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hoa_don_chi_tiet_id_seq', 1, false);


--
-- Name: phong_dich_vu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phong_dich_vu_id_seq', 1, false);


--
-- Name: phong_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phong_id_seq', 6, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 38, true);


--
-- Name: system_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_audit_log_id_seq', 34, true);


--
-- Name: vai_tro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vai_tro_id_seq', 5, true);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_pkey PRIMARY KEY (id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: danh_muc_dich_vu danh_muc_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_muc_dich_vu
    ADD CONSTRAINT danh_muc_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: dich_vu dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dich_vu
    ADD CONSTRAINT dich_vu_pkey PRIMARY KEY (id);


--
-- Name: goi_dich_vu_chi_tiet goi_dich_vu_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet
    ADD CONSTRAINT goi_dich_vu_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: goi_dich_vu goi_dich_vu_ma_goi_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_ma_goi_key UNIQUE (ma_goi);


--
-- Name: goi_dich_vu goi_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: hoa_don_chi_tiet hoa_don_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet
    ADD CONSTRAINT hoa_don_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: hoa_don hoa_don_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_pkey PRIMARY KEY (id);


--
-- Name: khach_hang khach_hang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khach_hang
    ADD CONSTRAINT khach_hang_pkey PRIMARY KEY (id);


--
-- Name: chuyen_gia_y_te ky_thuat_vien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chuyen_gia_y_te
    ADD CONSTRAINT ky_thuat_vien_pkey PRIMARY KEY (id);


--
-- Name: lich_dat lich_dat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_pkey PRIMARY KEY (id);


--
-- Name: lich_dieu_tri lich_dieu_tri_ma_lich_dieu_tri_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_ma_lich_dieu_tri_key UNIQUE (ma_lich_dieu_tri);


--
-- Name: lich_dieu_tri lich_dieu_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_pkey PRIMARY KEY (id);


--
-- Name: lich_lam_viec lich_lam_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_lam_viec
    ADD CONSTRAINT lich_lam_viec_pkey PRIMARY KEY (id);


--
-- Name: nguoi_dung nguoi_dung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT nguoi_dung_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: phong_dich_vu phong_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu
    ADD CONSTRAINT phong_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: phong phong_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong
    ADD CONSTRAINT phong_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: system_audit_log system_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log
    ADD CONSTRAINT system_audit_log_pkey PRIMARY KEY (id);


--
-- Name: thanh_toan thanh_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanh_toan
    ADD CONSTRAINT thanh_toan_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_y_te thiet_bi_y_te_ma_thiet_bi_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thiet_bi_y_te
    ADD CONSTRAINT thiet_bi_y_te_ma_thiet_bi_key UNIQUE (ma_thiet_bi);


--
-- Name: thiet_bi_y_te thiet_bi_y_te_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thiet_bi_y_te
    ADD CONSTRAINT thiet_bi_y_te_pkey PRIMARY KEY (id);


--
-- Name: vai_tro vai_tro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro
    ADD CONSTRAINT vai_tro_pkey PRIMARY KEY (id);


--
-- Name: voucher voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_pkey PRIMARY KEY (id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_ky_thuat_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_ky_thuat_vien_id_fkey FOREIGN KEY (ky_thuat_vien_id) REFERENCES public.chuyen_gia_y_te(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_lich_dieu_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_lich_dieu_tri_id_fkey FOREIGN KEY (lich_dieu_tri_id) REFERENCES public.lich_dieu_tri(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_buoi_tri_lieu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_buoi_tri_lieu_id_fkey FOREIGN KEY (buoi_tri_lieu_id) REFERENCES public.buoi_tri_lieu(id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_ky_thuat_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_ky_thuat_vien_id_fkey FOREIGN KEY (ky_thuat_vien_id) REFERENCES public.chuyen_gia_y_te(id);


--
-- Name: dich_vu dich_vu_danh_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dich_vu
    ADD CONSTRAINT dich_vu_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.danh_muc_dich_vu(id);


--
-- Name: goi_dich_vu_chi_tiet goi_dich_vu_chi_tiet_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet
    ADD CONSTRAINT goi_dich_vu_chi_tiet_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: goi_dich_vu_chi_tiet goi_dich_vu_chi_tiet_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet
    ADD CONSTRAINT goi_dich_vu_chi_tiet_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id) ON DELETE CASCADE;


--
-- Name: goi_dich_vu goi_dich_vu_danh_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.danh_muc_dich_vu(id);


--
-- Name: hoa_don_chi_tiet hoa_don_chi_tiet_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet
    ADD CONSTRAINT hoa_don_chi_tiet_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: hoa_don_chi_tiet hoa_don_chi_tiet_hoa_don_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet
    ADD CONSTRAINT hoa_don_chi_tiet_hoa_don_id_fkey FOREIGN KEY (hoa_don_id) REFERENCES public.hoa_don(id);


--
-- Name: hoa_don hoa_don_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: hoa_don hoa_don_lich_dat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_lich_dat_id_fkey FOREIGN KEY (lich_dat_id) REFERENCES public.lich_dat(id);


--
-- Name: khach_hang khach_hang_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khach_hang
    ADD CONSTRAINT khach_hang_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: chuyen_gia_y_te ky_thuat_vien_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chuyen_gia_y_te
    ADD CONSTRAINT ky_thuat_vien_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: lich_dat lich_dat_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: lich_dat lich_dat_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: lich_dat lich_dat_khuyen_nghi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_khuyen_nghi_dich_vu_id_fkey FOREIGN KEY (khuyen_nghi_dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: lich_dat lich_dat_khuyen_nghi_goi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_khuyen_nghi_goi_id_fkey FOREIGN KEY (khuyen_nghi_goi_id) REFERENCES public.goi_dich_vu(id);


--
-- Name: lich_dat lich_dat_ky_thuat_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_ky_thuat_vien_id_fkey FOREIGN KEY (ky_thuat_vien_id) REFERENCES public.chuyen_gia_y_te(id);


--
-- Name: lich_dat lich_dat_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_lich_dat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_lich_dat_id_fkey FOREIGN KEY (lich_dat_id) REFERENCES public.lich_dat(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: lich_lam_viec lich_lam_viec_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_lam_viec
    ADD CONSTRAINT lich_lam_viec_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: nguoi_dung nguoi_dung_vai_tro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT nguoi_dung_vai_tro_id_fkey FOREIGN KEY (vai_tro_id) REFERENCES public.vai_tro(id);


--
-- Name: phong_dich_vu phong_dich_vu_danh_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu
    ADD CONSTRAINT phong_dich_vu_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.danh_muc_dich_vu(id);


--
-- Name: phong_dich_vu phong_dich_vu_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu
    ADD CONSTRAINT phong_dich_vu_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: refresh_tokens refresh_tokens_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: system_audit_log system_audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log
    ADD CONSTRAINT system_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.nguoi_dung(id);


--
-- Name: thanh_toan thanh_toan_hoa_don_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanh_toan
    ADD CONSTRAINT thanh_toan_hoa_don_id_fkey FOREIGN KEY (hoa_don_id) REFERENCES public.hoa_don(id);


--
-- Name: voucher voucher_tao_boi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_tao_boi_fkey FOREIGN KEY (tao_boi) REFERENCES public.nguoi_dung(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Rkpgt4rrd2D4IuzsGqOKx2aMxygWbPsoi3oCJEj7LM7ieHKuOTnPaH9yv49Ku0J

