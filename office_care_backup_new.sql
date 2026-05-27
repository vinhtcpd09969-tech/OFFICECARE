--
-- PostgreSQL database dump
--

\restrict sHmWoV0a7NYOYT1VPsbOb7cv7KyyUwSUuLv2eN2m9yyTgpBIckHT26azx1VKqm4

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
-- Name: buoi_dich_vu_su_dung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buoi_dich_vu_su_dung (
    id integer NOT NULL,
    buoi_tri_lieu_id uuid NOT NULL,
    dich_vu_id uuid NOT NULL,
    so_lan_thuc_te integer DEFAULT 1 NOT NULL,
    ghi_chu_ly_do text,
    ktv_id uuid,
    trang_thai character varying(20) DEFAULT 'da_duyet'::character varying NOT NULL,
    tao_luc timestamp with time zone DEFAULT now() NOT NULL,
    duyet_boi uuid,
    duyet_luc timestamp with time zone,
    CONSTRAINT buoi_dich_vu_su_dung_trang_thai_check CHECK (((trang_thai)::text = ANY ((ARRAY['cho_duyet'::character varying, 'da_duyet'::character varying, 'tu_choi'::character varying])::text[])))
);


ALTER TABLE public.buoi_dich_vu_su_dung OWNER TO postgres;

--
-- Name: buoi_dich_vu_su_dung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buoi_dich_vu_su_dung_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.buoi_dich_vu_su_dung_id_seq OWNER TO postgres;

--
-- Name: buoi_dich_vu_su_dung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buoi_dich_vu_su_dung_id_seq OWNED BY public.buoi_dich_vu_su_dung.id;


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
-- Name: buoi_tri_lieu_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buoi_tri_lieu_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buoi_tri_lieu_id uuid NOT NULL,
    dich_vu_id uuid NOT NULL,
    so_luong integer DEFAULT 1,
    thoi_gian_thuc_hien timestamp without time zone DEFAULT now()
);


ALTER TABLE public.buoi_tri_lieu_dich_vu OWNER TO postgres;

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
    thiet_bi_yeu_cau character varying(100),
    loai_dich_vu character varying(20) DEFAULT 'chinh'::character varying NOT NULL,
    hien_thi_website boolean DEFAULT true NOT NULL,
    loai_dich_vu_ho_tro jsonb DEFAULT '[]'::jsonb
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
    danh_muc_id bigint,
    loai_goi character varying(20) DEFAULT 'lieu_trinh'::character varying,
    so_dv_toi_da_moi_buoi integer DEFAULT 5
);


ALTER TABLE public.goi_dich_vu OWNER TO postgres;

--
-- Name: goi_dich_vu_chi_tiet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goi_dich_vu_chi_tiet (
    id integer NOT NULL,
    goi_dich_vu_id uuid,
    dich_vu_id uuid,
    so_buoi_trong_goi integer DEFAULT 1,
    so_lan_toi_da_trong_goi integer DEFAULT 10,
    bat_buoc boolean DEFAULT false,
    thu_tu_thuc_hien integer DEFAULT 0
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
    tong_tien_truoc_giam bigint DEFAULT 0 NOT NULL,
    so_tien_giam bigint DEFAULT 0 NOT NULL,
    tong_tien_thanh_toan bigint NOT NULL,
    da_thanh_toan bigint DEFAULT 0 NOT NULL,
    trang_thai character varying(30) DEFAULT 'chua_thanh_toan'::character varying NOT NULL,
    ghi_chu text,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    ngay_thanh_toan timestamp without time zone,
    thu_boi uuid,
    loai_thanh_toan character varying(20) DEFAULT 'tra_thang'::character varying,
    voucher_id uuid,
    so_tien_giam_voucher bigint DEFAULT 0,
    so_tien_giam_phuong_thuc bigint DEFAULT 0,
    lich_dieu_tri_id uuid
);


ALTER TABLE public.hoa_don OWNER TO postgres;

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
-- Name: thong_bao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thong_bao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    tieu_de character varying(200) NOT NULL,
    noi_dung text NOT NULL,
    loai character varying(30) DEFAULT 'he_thong'::character varying NOT NULL,
    da_doc boolean DEFAULT false NOT NULL,
    thoi_gian_tao timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.thong_bao OWNER TO postgres;

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
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    tu_dong_ap_dung boolean DEFAULT false NOT NULL,
    yeu_cau_thanh_toan character varying(30) DEFAULT 'tat_ca'::character varying NOT NULL
);


ALTER TABLE public.voucher OWNER TO postgres;

--
-- Name: voucher_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voucher_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    dich_vu_id uuid NOT NULL
);


ALTER TABLE public.voucher_dich_vu OWNER TO postgres;

--
-- Name: voucher_goi_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voucher_goi_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    goi_dich_vu_id uuid NOT NULL
);


ALTER TABLE public.voucher_goi_dich_vu OWNER TO postgres;

--
-- Name: buoi_dich_vu_su_dung id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_dich_vu_su_dung ALTER COLUMN id SET DEFAULT nextval('public.buoi_dich_vu_su_dung_id_seq'::regclass);


--
-- Name: danh_muc_dich_vu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_muc_dich_vu ALTER COLUMN id SET DEFAULT nextval('public.danh_muc_dich_vu_id_seq'::regclass);


--
-- Name: goi_dich_vu_chi_tiet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet ALTER COLUMN id SET DEFAULT nextval('public.goi_dich_vu_chi_tiet_id_seq'::regclass);


--
-- Name: phong id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong ALTER COLUMN id SET DEFAULT nextval('public.phong_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: vai_tro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro ALTER COLUMN id SET DEFAULT nextval('public.vai_tro_id_seq'::regclass);


--
-- Data for Name: buoi_dich_vu_su_dung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buoi_dich_vu_su_dung (id, buoi_tri_lieu_id, dich_vu_id, so_lan_thuc_te, ghi_chu_ly_do, ktv_id, trang_thai, tao_luc, duyet_boi, duyet_luc) FROM stdin;
\.


--
-- Data for Name: buoi_tri_lieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buoi_tri_lieu (id, lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, danh_gia_truoc_buoi, danh_gia_sau_buoi, danh_gia_hieu_qua, so_thu_tu_buoi, danh_gia_id, trang_thai, canh_bao_dac_biet, ai_tom_tat_ngan, thoi_gian_ghi_chu) FROM stdin;
f8200f22-6934-4b04-9687-594bbbed8bc0	5430402b-f039-4cd4-9cdf-61b01a2b2599	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	c8e0361f-7467-4049-9b79-c66747a35bf6	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-24 07:53:39.614136	2026-05-24 08:53:39.614136	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
ecddf538-ac4b-4d29-8643-41a28536f460	a27ef709-9821-4aae-8f25-8f2319a36b3d	e432229f-347c-44d5-89ed-c17f453ccf6a	710d83a5-0671-406b-87ab-9776c5906073	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-23 07:53:39.624381	2026-05-23 08:53:39.624381	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
2f968811-5c35-41d3-9452-6fd2dae7ed5c	0b5f3114-ef48-44d0-bbdf-e427926e4417	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	12717916-a47c-40d5-8b31-f945b865ee9f	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-22 07:53:39.633306	2026-05-22 08:53:39.633306	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
af794d93-6b29-43bb-b3f9-0a12247b7d63	224daf0e-cdfa-4a88-ac22-53f91ee5de0f	0a8e9fa8-e68f-4de2-833c-4a722ac64414	12717916-a47c-40d5-8b31-f945b865ee9f	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-21 07:53:39.639541	2026-05-21 08:53:39.639541	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
6ac10cab-408c-4eb7-bc8f-6f649a500d1d	9f35acc6-2653-4427-ad43-7c583e7d440b	172f241c-6a22-4270-87d3-2736e0471ad6	12717916-a47c-40d5-8b31-f945b865ee9f	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-20 07:53:39.645428	2026-05-20 08:53:39.645428	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
e918869d-2707-438d-b782-73b31773376a	9817c27e-27f3-475f-9f8c-2f612e9949e4	cda19bc9-282e-4a71-9878-7641480e6f11	c8e0361f-7467-4049-9b79-c66747a35bf6	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-19 07:53:39.651321	2026-05-19 08:53:39.651321	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
ea66f3bb-6de2-4354-b56f-65e62cda50ec	9362b568-b2bf-4ed3-8e39-cf526dd056a0	69267ba5-17ab-4cf7-84c3-9b16e07141f3	710d83a5-0671-406b-87ab-9776c5906073	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-18 07:53:39.658486	2026-05-18 08:53:39.658486	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
c7780fa9-be06-4eab-881c-498eee9bc2e8	5539b55e-3ec2-4ec2-ae6e-c6bbe5b20fcf	22df556e-72f8-478d-87be-e35d31569305	cf11bcae-d2ef-41c7-8765-af183240a5ec	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-17 07:53:39.664628	2026-05-17 08:53:39.664628	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
038a0c8d-c288-4fdc-8dff-87d35f9ff9e4	c6496803-4937-459c-93cf-aa45a4d1d936	22df556e-72f8-478d-87be-e35d31569305	c8e0361f-7467-4049-9b79-c66747a35bf6	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-16 07:53:39.670157	2026-05-16 08:53:39.670157	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
91429779-7939-4e4d-8e38-ca1569e1f45b	103eeaef-ebf2-45ce-b447-4cd0721c8c72	cfd6e67f-99d2-49c7-9df1-309456c09cba	cf11bcae-d2ef-41c7-8765-af183240a5ec	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-15 07:53:39.676434	2026-05-15 08:53:39.676434	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
447e0868-6f51-4e65-b2a6-f30864f71a53	7c82d911-e991-4512-aa0a-90a60a385f15	7ba87b5a-720e-4502-9057-cee106e17cc6	c8e0361f-7467-4049-9b79-c66747a35bf6	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-14 07:53:39.682738	2026-05-14 08:53:39.682738	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
25818212-d6aa-4cb3-8475-5ee45d919dd3	a68836f8-8c77-4f65-a901-10198e2cb10f	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	cf11bcae-d2ef-41c7-8765-af183240a5ec	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-13 07:53:39.688633	2026-05-13 08:53:39.688633	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
e4426e8c-9ab8-4b01-9c0b-2d2619ed0100	6083b843-433a-4cef-b8ef-b5858b9b97e8	e432229f-347c-44d5-89ed-c17f453ccf6a	cf11bcae-d2ef-41c7-8765-af183240a5ec	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-12 07:53:39.694258	2026-05-12 08:53:39.694258	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
42275fd8-3053-4983-8d63-2af28bce35bb	93139688-f47f-4b66-b897-a5b2bf719ead	bcea21d1-648e-4072-a6a1-89130918d06c	7f6e2f13-504a-4aa8-81fa-a7180d40e03b	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-11 07:53:39.699479	2026-05-11 08:53:39.699479	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
cdea13c5-1795-44d8-b227-4fc6690690fe	1a417e1c-0518-4b42-916f-d52ad120f3c7	dbb444ac-d3e2-4e99-95e1-4951064ec20c	12717916-a47c-40d5-8b31-f945b865ee9f	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	2026-05-10 07:53:39.705287	2026-05-10 08:53:39.705287	\N	\N	\N	\N	\N	hoan_thanh	\N	\N	\N
b8a14508-10e2-45ec-bd08-487007f13179	0a6065c9-524f-4ce4-a341-039eb69ea986	7f56ecf7-6802-4b55-a9ee-b00232358176	477bd0ab-c6e0-488a-9fc7-b789c8bf3c2c	37	8de1ed6c-2311-453d-b7f2-ebed6e851f41	2026-05-26 20:39:55.763851	2026-05-26 21:39:55.763851	5	5	5	1	\N	hoan_thanh	\N	Bệnh nhân đáp ứng tốt trong buổi phục hồi chức năng cơ bản đầu tiên.	\N
\.


--
-- Data for Name: buoi_tri_lieu_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buoi_tri_lieu_dich_vu (id, buoi_tri_lieu_id, dich_vu_id, so_luong, thoi_gian_thuc_hien) FROM stdin;
\.


--
-- Data for Name: chuyen_gia_y_te; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chuyen_gia_y_te (id, nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem, chung_chi, mo_ta_ban_than, anh_dai_dien_url, trang_thai, ngay_vao_lam) FROM stdin;
477bd0ab-c6e0-488a-9fc7-b789c8bf3c2c	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	BS001	Bác sĩ chuyên khoa	10	\N	\N	\N	hoat_dong	\N
c8e0361f-7467-4049-9b79-c66747a35bf6	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	KTV001	Vật lý trị liệu	2	\N	\N	\N	hoat_dong	\N
cf11bcae-d2ef-41c7-8765-af183240a5ec	c87643c4-4823-48e2-a8fd-6bd804c8db5a	KTV002	Vật lý trị liệu	6	\N	\N	\N	hoat_dong	\N
710d83a5-0671-406b-87ab-9776c5906073	7ff1127c-433b-41ca-9f47-7298cdf0ea96	KTV003	Vật lý trị liệu	4	\N	\N	\N	hoat_dong	\N
12717916-a47c-40d5-8b31-f945b865ee9f	8efcc325-bb38-4522-9b76-5b8ccf4eda37	KTV004	Vật lý trị liệu	10	\N	\N	\N	hoat_dong	\N
7f6e2f13-504a-4aa8-81fa-a7180d40e03b	2712e855-9e22-4d5c-9036-f457d8e1d100	KTV005	Vật lý trị liệu	10	\N	\N	\N	hoat_dong	\N
\.


--
-- Data for Name: danh_gia_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_gia_dich_vu (id, buoi_tri_lieu_id, khach_hang_id, ky_thuat_vien_id, so_sao_tong, so_sao_ktv, nhan_xet, hieu_qua_dieu_tri, se_quay_lai, hien_thi_cong_khai, thoi_gian_danh_gia) FROM stdin;
5bfa5929-3e1b-4557-be42-d5c6157cc92a	f8200f22-6934-4b04-9687-594bbbed8bc0	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	c8e0361f-7467-4049-9b79-c66747a35bf6	4	4	Áo khâu chỉ mướn đồng mướn thì không.	tot	\N	f	2026-05-24 09:53:39.617643
fc915057-ead0-41b7-8f2b-c058bb8ea3af	ecddf538-ac4b-4d29-8643-41a28536f460	e432229f-347c-44d5-89ed-c17f453ccf6a	710d83a5-0671-406b-87ab-9776c5906073	4	4	Độc trời ác ngọt áo tôi núi lỗi bạn.	tot	\N	f	2026-05-23 09:53:39.626869
a0af7e51-1b16-4e0e-a33c-73265158aa41	2f968811-5c35-41d3-9452-6fd2dae7ed5c	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	12717916-a47c-40d5-8b31-f945b865ee9f	4	4	Đá nghỉ ghế bơi nhà độc hai nhà.	tot	\N	f	2026-05-22 09:53:39.635224
8118ecfc-9b13-4979-830c-2d882170afc0	af794d93-6b29-43bb-b3f9-0a12247b7d63	0a8e9fa8-e68f-4de2-833c-4a722ac64414	12717916-a47c-40d5-8b31-f945b865ee9f	4	4	Em khoan tủ bốn xe chết đập đồng.	tot	\N	f	2026-05-21 09:53:39.641048
29d81f45-e1b9-4227-97c9-90660ffd8e1e	6ac10cab-408c-4eb7-bc8f-6f649a500d1d	172f241c-6a22-4270-87d3-2736e0471ad6	12717916-a47c-40d5-8b31-f945b865ee9f	3	3	Tím máy ờ thế trời áo cửa hương.	tot	\N	f	2026-05-20 09:53:39.646961
11d74dfe-1915-421e-a786-67703e813808	e918869d-2707-438d-b782-73b31773376a	cda19bc9-282e-4a71-9878-7641480e6f11	c8e0361f-7467-4049-9b79-c66747a35bf6	5	5	Hai nón con là hóa lầu tui gió giày.	tot	\N	f	2026-05-19 09:53:39.653102
3c18e66f-5d2e-4514-bd91-ad1199e1d3ab	ea66f3bb-6de2-4354-b56f-65e62cda50ec	69267ba5-17ab-4cf7-84c3-9b16e07141f3	710d83a5-0671-406b-87ab-9776c5906073	5	5	Tím yêu yêu được.	tot	\N	f	2026-05-18 09:53:39.660506
9c1b79ca-d366-48cf-aa23-a0004eb2c2d1	c7780fa9-be06-4eab-881c-498eee9bc2e8	22df556e-72f8-478d-87be-e35d31569305	cf11bcae-d2ef-41c7-8765-af183240a5ec	5	5	Cái nước ghế nha đá thế tô bàn tím.	tot	\N	f	2026-05-17 09:53:39.666071
bcabd0c5-50f9-4726-a0df-0a4af905bb6b	038a0c8d-c288-4fdc-8dff-87d35f9ff9e4	22df556e-72f8-478d-87be-e35d31569305	c8e0361f-7467-4049-9b79-c66747a35bf6	3	3	Thích vá cái bơi mây.	tot	\N	f	2026-05-16 09:53:39.67159
17e74b8e-574a-458a-83f2-5e9b86e6b414	91429779-7939-4e4d-8e38-ca1569e1f45b	cfd6e67f-99d2-49c7-9df1-309456c09cba	cf11bcae-d2ef-41c7-8765-af183240a5ec	3	3	Đã tui thích viết ghế đỏ đạp khâu làm.	tot	\N	f	2026-05-15 09:53:39.678279
c5fcb2b3-1af2-446c-99e8-938187c02dcd	447e0868-6f51-4e65-b2a6-f30864f71a53	7ba87b5a-720e-4502-9057-cee106e17cc6	c8e0361f-7467-4049-9b79-c66747a35bf6	3	3	Hàng mượn bơi phá thế tàu sáu.	tot	\N	f	2026-05-14 09:53:39.684231
fb0067f5-5863-4bf6-8b0a-8a973f11f671	25818212-d6aa-4cb3-8475-5ee45d919dd3	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	cf11bcae-d2ef-41c7-8765-af183240a5ec	5	5	Đánh nghỉ đồng vàng là leo xuồng.	tot	\N	f	2026-05-13 09:53:39.69011
2f500156-4036-4867-81c6-c96dbc0ef55a	e4426e8c-9ab8-4b01-9c0b-2d2619ed0100	e432229f-347c-44d5-89ed-c17f453ccf6a	cf11bcae-d2ef-41c7-8765-af183240a5ec	4	4	Mượn làm độc mua biển lỗi tôi.	tot	\N	f	2026-05-12 09:53:39.695617
61996ad9-1745-43e1-b697-63802bdbc246	42275fd8-3053-4983-8d63-2af28bce35bb	bcea21d1-648e-4072-a6a1-89130918d06c	7f6e2f13-504a-4aa8-81fa-a7180d40e03b	3	3	Hết làm tím anh may một.	tot	\N	f	2026-05-11 09:53:39.701005
4627c9df-b13b-4ce0-b2e3-06bbc39888d5	cdea13c5-1795-44d8-b227-4fc6690690fe	dbb444ac-d3e2-4e99-95e1-4951064ec20c	12717916-a47c-40d5-8b31-f945b865ee9f	4	4	Hai ruộng vẽ.	tot	\N	f	2026-05-10 09:53:39.707081
\.


--
-- Data for Name: danh_muc_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_muc_dich_vu (id, ten_danh_muc, mo_ta, thu_tu_hien_thi, an_hien) FROM stdin;
21	Khám & Lượng giá	Khám lâm sàng và đánh giá tư thế	0	t
22	Trị liệu cơ sâu & Chuyên sâu	Các dịch vụ linh động cấu thành liệu trình hoặc bán lẻ	0	t
23	Phục hồi & Phòng ngừa	Tập luyện phục hồi chức năng và định hình tư thế	0	t
24	Dịch vụ bổ trợ (Add-on)	Các liệu pháp thư giãn và phục hồi bổ trợ	0	t
\.


--
-- Data for Name: dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dich_vu (id, danh_muc_id, ten_dich_vu, mo_ta_ngan, mo_ta_chi_tiet, thoi_luong_phut, don_gia, hinh_anh_url, trang_thai, thu_tu_hien_thi, thiet_bi_yeu_cau, loai_dich_vu, hien_thi_website, loai_dich_vu_ho_tro) FROM stdin;
8de1ed6c-2311-453d-b7f2-ebed6e851f41	22	Trị liệu giảm đau bằng dòng điện xung	Dịch vụ Trị liệu giảm đau bằng dòng điện xung (Mã: SVC-ELT)	Dán các điện cực hydrogel y khoa lên vùng cơ đau nhức, sử dụng thiết bị chuyên dụng phát dòng điện xung tần số thấp thích hợp để cắt đứt tín hiệu đau dây thần kinh.	15	120000	\N	hoat_dong	0	Máy điện xung	chinh	f	["Ức chế lập tức đường truyền tín hiệu đau lên não bộ theo cơ chế cổng kiểm soát đau.", "Kích thích cơ thể tự giải phóng Endorphin (hormone giảm đau tự nhiên) để xoa dịu vùng tổn thương.", "Kích thích tuần hoàn máu sâu giúp tiêu viêm, giảm sưng nề mô mềm cục bộ."]
04459d03-a173-4aaf-b468-42281e48b7e9	23	Hướng dẫn tập phục hồi chức năng	Dịch vụ Hướng dẫn tập phục hồi chức năng (Mã: SVC-CEG)	Bác sĩ hoặc Kỹ thuật viên trực tiếp hướng dẫn khách thực hiện chuẩn xác các bài tập ổn định khớp, kích hoạt cơ lõi yếu và điều chỉnh tư thế đứng/ngồi chuẩn y khoa.	10	70000	\N	hoat_dong	0	\N	chinh	f	["Tăng cường sức mạnh và độ bền cho các nhóm cơ hỗ trợ bảo vệ cột sống.", "Sửa sai lệch tư thế (gù lưng, cổ rùa, lệch xương chậu) tận gốc.", "Duy trì hiệu quả trị liệu lâu dài, ngăn ngừa tái phát cơn đau cơ xương khớp."]
880044bc-da2c-47e4-a8cf-c16aa319f3d1	22	Nhiệt trị liệu hồng ngoại	Dịch vụ Nhiệt trị liệu hồng ngoại (Mã: SVC-HET)	Sử dụng đèn hồng ngoại y khoa chuyên khoa chiếu tia nhiệt trực tiếp lên vùng khớp viêm hoặc thắt lưng đau nhức ở cự ly y khoa tiêu chuẩn.	15	80000	\N	hoat_dong	0	Đèn hồng ngoại	chinh	f	["Tác dụng nhiệt nóng sâu làm giãn cơ toàn vùng, loại bỏ tình trạng cứng khớp buổi sáng.", "Giãn nở mạch máu ngoại vi, đẩy nhanh tốc độ đào thải độc tố và hấp thụ viêm sưng.", "Làm dịu hệ thần kinh nhạy cảm, đem lại cảm giác ấm áp và thư giãn sâu cho khách hàng."]
f53d9aca-6650-4e6c-8da1-999701dacb4b	22	Kỹ thuật di động khớp tăng biên độ	Dịch vụ Kỹ thuật di động khớp tăng biên độ (Mã: SVC-JMT)	Áp dụng kỹ thuật trượt khớp cơ học bậc 1-3 theo chuẩn y khoa quốc tế lên các diện khớp bị hạn chế biên độ vận động do xơ hóa dây chằng.	15	130000	\N	hoat_dong	0	\N	chinh	f	["Kích thích tăng tiết dịch khớp tự nhiên để bôi trơn diện khớp, giảm ma sát gây thoái hóa.", "Mở rộng nhanh biên độ khớp bị giới hạn do viêm bám gân hoặc thoái hóa diện khớp.", "Ngăn chặn triệt để nguy cơ dính khớp và xơ cứng bao khớp gây tàn tật."]
e8f4278f-ef2c-42a9-8684-38aa3b93bfbe	22	Di động mô mềm giải phóng cơ	Dịch vụ Di động mô mềm giải phóng cơ (Mã: SVC-MRL)	Kỹ thuật sử dụng các ngón tay và lòng bàn tay vuốt miết, trượt mô liên kết mềm dọc bó cơ căng thẳng nhằm phá vỡ các điểm kết dính cơ nông.	15	100000	\N	hoat_dong	0	\N	chinh	f	["Tháo xoắn cơ tức thì, loại bỏ cảm giác căng tức bứt rứt khó chịu ở cơ bắp.", "Phục hồi độ đàn hồi tự nhiên linh hoạt của hệ thống mô mềm quanh khớp.", "Tạo cảm giác nhẹ nhõm, thư thái ngay trong buổi trị liệu."]
ddf7dbe1-18e3-40d8-8ed7-4f9822a9e80a	22	Giải phóng cơ hình lê chuyên sâu	Dịch vụ Giải phóng cơ hình lê chuyên sâu (Mã: SVC-PMR)	Kỹ thuật ấn bấm chuyên sâu giải phóng căng cơ vùng mông (đặc biệt cơ hình lê - Piriformis) để giảm áp cho dây thần kinh tọa chạy bên dưới cơ mông.	15	130000	\N	hoat_dong	0	\N	chinh	f	["Cắt đứt ngay cơn đau tê dọc mông lan xuống đùi và bắp chân (đau thần kinh tọa).", "Giảm co thắt sâu vùng hông chậu, khôi phục bước đi linh hoạt vững vàng.", "Giải phóng tình trạng mỏi khớp háng khi ngồi làm việc quá lâu một chỗ."]
2053ea53-b173-4b40-9807-e265b9030ade	22	Vận động trị liệu khớp vai	Dịch vụ Vận động trị liệu khớp vai (Mã: SVC-SMT)	Kỹ thuật viên thực hiện các kỹ thuật vận động khớp thụ động và chủ động có trợ giúp khớp vai nhằm khôi phục cơ học xoay vai.	15	120000	\N	hoat_dong	0	\N	chinh	f	["Hỗ trợ phá vỡ tổ chức xơ dính quanh bao khớp vai gây đông cứng vai (frozen shoulder).", "Giúp khách hàng dễ dàng thực hiện các động tác sinh hoạt như chải đầu, giơ tay cao, gãi lưng.", "Giải tỏa chứng đau mỏi vai sâu bứt rứt gây mất ngủ về đêm."]
bbb51293-b994-4a4f-91e1-e878ca9c502d	22	Kéo giãn cột sống thắt lưng bằng máy	Dịch vụ Kéo giãn cột sống thắt lưng bằng máy (Mã: SVC-SST)	Sử dụng thiết bị kéo giãn cột sống tự động y khoa, cài đặt đai ngực đai chậu và lực kéo kéo - nhả theo chu kỳ phù hợp với trọng lượng cơ thể để giải áp cột sống.	15	100000	\N	hoat_dong	0	Giường kéo giãn	chinh	f	["Giảm áp suất nội đĩa đệm thắt lưng tối đa, tạo lực hút âm giúp nhân nhầy thoát vị co hồi về vị trí cũ.", "Mở rộng các lỗ liên hợp cột sống giải phóng chèn ép rễ thần kinh thắt lưng.", "Cắt cơn đau lưng cấp và tê bì chân do thoát vị đĩa đệm gây ra."]
a7a9fbb2-cc2c-49f2-bfa1-592f15141eee	22	Kỹ thuật giải cơ chuyên sâu	Dịch vụ Kỹ thuật giải cơ chuyên sâu (Mã: SVC-DTT)	Tác động lực vật lý sâu và chậm dọc theo thớ cơ nông đến cơ sâu, xác định và giải phóng các nút thắt cơ (Trigger Points) gây co cứng dai dẳng.	20	150000	\N	hoat_dong	0	\N	chinh	f	["Phá tan các bó cơ co thắt mãn tính, trả lại chiều dài sinh lý tối ưu cho thớ cơ.", "Kích thích tuần hoàn máu mang dưỡng chất và oxy đến nuôi dưỡng vùng mô cơ bị xơ hóa.", "Giảm nhức mỏi cơ bắp tức thì sau vận động nặng hoặc ngồi làm việc sai tư thế kéo dài."]
270b0678-b61c-48c7-94d4-b8c1081b55d5	22	Kỹ thuật giải phóng điểm bám gân	Dịch vụ Kỹ thuật giải phóng điểm bám gân (Mã: SVC-TRT)	Tác động miết bấm ngang thớ gân cơ bị tổn thương tại khuỷu tay hoặc cổ tay nhằm kích thích tăng sinh tuần hoàn máu tại điểm bám tận của gân.	15	120000	\N	hoat_dong	0	\N	chinh	f	["Đặc trị đau mỏi cổ tay, khuỷu tay (Hội chứng ống cổ tay, viêm gân khuỷu tay Tennis Elbow).", "Tiêu trừ các điểm viêm dính vi mô quanh bao gân cơ.", "Tăng cường lực cầm nắm của bàn tay, giúp gõ phím di chuột không đau nhức."]
2cd8d6a2-011d-4681-bed8-16db97962fb1	22	Vận động trị liệu khớp cổ tay	Dịch vụ Vận động trị liệu khớp cổ tay (Mã: SVC-WMT)	Di động nhẹ nhàng và vận động các diện khớp xương nhỏ vùng cổ tay và bàn ngón tay để kéo giãn dây chằng quanh ống cổ tay.	15	120000	\N	hoat_dong	0	\N	chinh	f	["Giải phóng chèn ép thần kinh giữa trong hội chứng ống cổ tay.", "Khắc phục chứng tê rần, mất cảm giác hoặc đau buốt ngón tay khi làm việc văn phòng.", "Khôi phục khả năng xoay gấp cổ tay mượt mà không lục cục."]
530bcb10-ae49-4918-8b9e-1f6f1fdd9d41	22	Trị liệu Cổ - Vai - Gáy "Khơi Thông Kinh Lạc"	Dịch vụ Trị liệu Cổ - Vai - Gáy "Khơi Thông Kinh Lạc" (Mã: CVG-CS-75)	Kỹ thuật viên áp dụng liệu pháp kết hợp xoa bóp cơ sâu y khoa và bấm huyệt cổ truyền: (1) Sử dụng kỹ thuật Myofascial Release miết bóc tách cân cơ nông và sâu vùng cơ thang, cơ nâng vai, cơ ức đòn chũm; (2) Bấm huyệt giải tỏa ách tắc các huyệt Phong Trì, Kiên Tỉnh, Đại Chùy, Thiên Tông; (3) Chiếu đèn hồng ngoại hồng ngoại sâu kết hợp đắp thảo dược ấm để làm mềm cơ bắp; (4) Vận động xoay nghiêng cổ thụ động giải tỏa cứng nghẹt khớp cột sống cổ.	75	400000	\N	hoat_dong	0	\N	chinh	f	["Giải phóng tức thì tình trạng căng thắt cơ vai gáy dai dẳng do ít vận động hoặc làm việc máy tính liên tục.", "Tăng lưu lượng máu qua động mạch đốt sống thân nền, đẩy lùi cơn đau đầu cơ năng, hoa mắt, chóng mặt và mất ngủ.", "Khôi phục hoàn toàn tầm vận động xoay, cúi ngửa của cổ vai gáy, tạo cảm giác nhẹ nhõm tức thì."]
4261cae2-b888-4e8d-864c-de4978610d55	22	Phục Hồi Đau Lưng - Thoát Vị Đĩa Đệm	Dịch vụ Phục Hồi Đau Lưng - Thoát Vị Đĩa Đệm (Mã: DL-TVDD-90)	Quy trình phục hồi cột sống chuyên sâu gồm các bước: (1) Kỹ thuật Deep Tissue giải phóng xơ hóa cơ dựng gai và cơ vuông thắt lưng; (2) Kéo giãn thắt lưng bằng máy giường tự động giải áp theo tải lượng chuẩn; (3) Điện dung siêu âm tần số quét sâu chống phù nề và kháng viêm rễ thần kinh; (4) Di động khớp cột sống thắt lưng phục hồi trượt khớp; (5) Hướng dẫn chi tiết bài tập ổn định cơ lõi thắt lưng chậu phòng tái phát.	90	650000	\N	hoat_dong	0	\N	chinh	f	["Giảm áp lực cơ học nội đĩa đệm, tạo lực hút chân không hỗ trợ nhân nhầy đĩa đệm co hồi giảm chèn ép.", "Giải phóng rễ thần kinh tọa, triệt tiêu cơn đau buốt buốt rát từ thắt lưng lan dọc xuống mông và chân.", "Thiết lập hệ thống cơ bảo vệ thắt lưng bền vững, nâng đỡ an toàn cho cột sống khi sinh hoạt."]
8fa00934-9ad5-4917-8457-b604c4b3640a	22	Giảm Đau Cấp Tốc - Co Thắt Cơ Cấp	Dịch vụ Giảm Đau Cấp Tốc - Co Thắt Cơ Cấp (Mã: GDC-CAP-60)	Kỹ thuật viên thực hiện can thiệp giảm co rút cấp: (1) Xoa bóp vuốt nhẹ làm quen cơ, tránh co thắt phòng vệ; (2) Điện xung trị liệu tần số giảm đau cấp TENS cắt đứt dẫn truyền thần kinh đau; (3) Chườm nóng ẩm thảo dược giãn mạch hoặc chườm đá y khoa cục bộ tùy tình trạng viêm cơ; (4) Kéo giãn cơ thụ động nhẹ nhàng tăng tiến giúp xả áp nhóm cơ đang khóa chặt.	60	450000	\N	hoat_dong	0	\N	chinh	f	["Phong tỏa ngay tín hiệu đau cấp tính lên não bộ, xoa dịu tức thì vùng cơ bị co xoắn dữ dội.", "Hóa giải tình trạng khóa cứng lưng/cổ đột ngột sau chấn thương thể thao, mang vác nặng hay ngủ sai tư thế.", "Khôi phục khả năng xoay người, vận động cơ bản để đi lại bình thường ngay sau buổi can thiệp đầu tiên."]
14417192-8d2f-424f-a51b-8a9dd9181863	22	Trị liệu Hội Chứng Ống Cổ Tay & Tê Bì	Dịch vụ Trị liệu Hội Chứng Ống Cổ Tay & Tê Bì (Mã: CL-HAND-45)	Can thiệp chuyên sâu vùng cổ tay: (1) Bóc tách mô liên kết mềm vùng cẳng tay và dải gan tay phá vỡ xơ dính; (2) Siêu âm trị liệu sâu làm mềm bao khớp quanh cổ tay; (3) Áp dụng kỹ thuật di động dây thần kinh giữa giúp thần kinh trượt tự do trong ống cổ tay; (4) Chỉnh trục khớp cổ bàn ngón tay thụ động giảm áp.	45	300000	\N	hoat_dong	0	\N	chinh	f	["Tiêu sưng nề mô đệm và bao gân trong ống cổ tay, giải phóng dây thần kinh giữa khỏi nghẹt cứng.", "Xóa bỏ dứt điểm chứng tê rần đầu ngón tay như kiến bò, giảm thiểu nguy cơ teo cơ mô ngón cái.", "Phục hồi lực cầm nắm khỏe khoắn, giúp gõ phím di chuột linh hoạt không buốt mỏi cổ tay."]
a83e53d7-db1e-4c54-80d6-1bc012a2359b	22	Kéo giãn cơ toàn thân chủ động	Dịch vụ Kéo giãn cơ toàn thân chủ động (Mã: SVC-STR)	Kỹ thuật viên phối hợp cùng khách thực hiện các chuỗi động tác kéo giãn cơ chuỗi sau, cơ liên sườn và giải áp toàn bộ các khớp chính.	15	100000	\N	hoat_dong	0	\N	chinh	f	["Gia tăng độ dẻo dai đàn hồi của toàn bộ hệ thống cơ xương khớp.", "Giải phóng chứng đau mỏi tích tụ toàn thân do thói quen ngồi lì làm việc cả ngày.", "Tăng cường độ linh hoạt, giúp cơ thể chuyển động nhẹ nhàng thanh thoát."]
6da0076b-b839-440f-a440-521b89c50e83	23	Phục Hồi Cơ Bắp Thể Thao Chuyên Sâu	Dịch vụ Phục Hồi Cơ Bắp Thể Thao Chuyên Sâu (Mã: PT-SPORTS-90)	Phác đồ xả cơ cho vận động viên: (1) Sử dụng thiết bị trị liệu rung tần số cao giải phóng màng cơ nông; (2) Nhào nặn cơ sâu (Deep Tissue) phá vỡ các liên kết axit lactic ứ đọng; (3) Kéo giãn cơ kỹ thuật PNF kháng lực thụ động kích hoạt đàn hồi cơ; (4) Nén ép áp lực hơi phục hồi tuần hoàn tĩnh mạch; (5) Hướng dẫn bài tập giãn cơ tĩnh chủ động.	90	800000	\N	hoat_dong	0	\N	chinh	f	["Đào thải nhanh chóng axit lactic tích tụ gây đau nhức mỏi cơ sau tập luyện thi đấu cường độ cao.", "Giải tỏa căng thắt sợi cơ quá mức, bảo vệ cơ bắp khỏi rách cơ, chuột rút hoặc viêm điểm bám gân.", "Khôi phục độ linh hoạt dẻo dai và công suất tối đa của cơ bắp cho buổi tập tiếp theo."]
c721dea7-f51a-4aa9-a572-4f85082e3d7e	23	Điều Trị Thoái Hóa Khớp (Gối/Vai/Háng)	Dịch vụ Điều Trị Thoái Hóa Khớp (Gối/Vai/Háng) (Mã: PT-ARTH-90)	Can thiệp chuyên sâu giảm thoái hóa: (1) Chiếu hồng ngoại làm mềm xơ dính bao khớp; (2) Di động diện khớp bóc tách sụn khớp thoái hóa; (3) Tập cơ tứ đầu đùi, cơ mông khớp háng hoặc cơ quay vai kháng lực nhẹ nhàng tăng tiến; (4) Sóng ngắn hoặc thấu nhiệt vi ba tăng tuần hoàn mạch máu quanh khớp.	90	900000	\N	hoat_dong	0	\N	chinh	f	["Tăng sức mạnh hệ cơ quanh khớp giúp nâng đỡ sụn khớp, giảm đáng kể ma sát cơ học lên diện khớp thoái hóa.", "Chặn đứng phản ứng viêm thoái hóa và ngăn ngừa gai xương tiến triển qua cân bằng sinh học cơ học khớp.", "Cải thiện đáng kể chức năng di chuyển, lên xuống cầu thang hay đứng lên ngồi xuống thoải mái không đau đớn."]
275ee68b-75c7-460f-b8b1-a034de844dee	23	Trị Liệu & Phục Hồi Chức Năng Thần Kinh	Dịch vụ Trị Liệu & Phục Hồi Chức Năng Thần Kinh (Mã: PT-NEURO-120)	Can thiệp chuyên sâu đặc trị thần kinh (sau tai biến, chấn thương cột sống): (1) Đánh giá phản xạ co thắt và trương lực cơ; (2) Áp dụng kỹ thuật PNF kích thích thần kinh cơ tạo thuận mẫu vận động; (3) Hướng dẫn mẫu chuyển động sinh hoạt chức năng cơ bản; (4) Điện xung FES kích thích nhóm cơ liệt co duỗi chủ động.	120	1300000	\N	hoat_dong	0	\N	chinh	f	["Kích thích khả năng mềm dẻo thần kinh của não bộ để học lại các chuyển động đã mất sau tai biến.", "Điều hòa trương lực cơ hiệu quả, ngăn ngừa co rút gân gập khớp gây biến dạng cong vẹo các chi.", "Nâng cao khả năng tự chủ sinh hoạt (đứng, ngồi dậy, tự xúc ăn), mang lại sự tự tin cho người bệnh."]
bade147a-f0cb-4ce1-898f-4d75131a5944	23	Trị Liệu Cong Vẹo Cột Sống & Sửa Tư Thế	Dịch vụ Trị Liệu Cong Vẹo Cột Sống & Sửa Tư Thế (Mã: PT-POSTURE-60)	Can thiệp định hình không xâm lấn: (1) Kéo giãn cơ chậu sườn thắt lưng bên lõm, co nhỏ cơ căng giãn bên lồi cột sống vẹo; (2) Tập bài tập Schroth điều hướng không gian 3 chiều; (3) Hướng dẫn kỹ thuật thở xoay chiều sườn mở rộng lồng ngực bị ép lép; (4) Tập thăng bằng trên bóng bosu chỉnh trục vai chậu thẳng hàng.	60	700000	\N	hoat_dong	0	\N	chinh	f	["Nắn chỉnh xoay đốt sống cong vẹo cơ học, giảm đáng kể góc vẹo Cobb cột sống tự nhiên.", "Thiết lập lại cân bằng vai chậu ngang bằng, sửa lệch trục xương chậu giúp dáng đi thẳng đẹp.", "Giải tỏa lực ép sườn lên phổi, tăng dung tích hô hấp mang lại thể trạng khỏe mạnh, năng động."]
093eee29-9a02-4bb8-b06c-c18d0a3f96ea	24	Massage Thư Giãn Phục Hồi	Dịch vụ Massage Thư Giãn Phục Hồi (Mã: ADD-MASSAGE-60)	Kỹ thuật viên thực hiện xoa bóp, vuốt miết toàn thân nhịp nhàng kết hợp tinh dầu dừa phân đoạn cao cấp giải tỏa cơ nông.	60	350000	\N	hoat_dong	0	\N	bo_sung	t	["Làm mềm cơ bắp mệt mỏi, xoa dịu các cơn đau cơ nhẹ sau những ngày ngồi làm việc sai tư thế.", "Thúc đẩy tuần hoàn máu và đem lại cảm giác nhẹ nhõm, dễ chịu tức thì."]
1e9dcb82-56c5-430c-9035-ad07f4913203	22	Trị liệu Đau Nhức Khớp Gối / Khớp Vai	Dịch vụ Trị liệu Đau Nhức Khớp Gối / Khớp Vai (Mã: CL-JOINT-60)	Phác đồ liên hoàn cơ khớp: (1) Giải phóng co thắt nhóm cơ lớn hỗ trợ khớp (cơ đùi trước/sau với gối, cơ quanh đai vai với vai); (2) Di động khớp thụ động bậc I-II bôi trơn ổ khớp; (3) Chiếu laser năng lượng cao đẩy nhanh sinh hóa lành sụn vi mô; (4) Bài tập đồng co cơ đẳng trường tăng cường tính vững khớp.	60	350000	\N	hoat_dong	0	\N	chinh	f	["Kích thích tăng tiết dịch ổ khớp tự nhiên để bôi trơn diện khớp, đẩy lùi tiếng kêu lục cục thoái hóa khớp.", "Giải tỏa tình trạng xơ dính bao khớp, khôi phục tối đa biên độ vận động dạng khép và gấp duỗi khớp.", "Tiêu dịch viêm và sưng nề khớp gối/vai, mang lại những bước đi và chuyển động tay nhẹ nhàng, tự tin."]
05d6f5a2-f3ed-48c0-8819-02bb4bc3b30e	24	Trị Liệu Tinh Dầu Thư Giãn	Dịch vụ Trị Liệu Tinh Dầu Thư Giãn (Mã: ADD-AROMA-45)	Massage vuốt lực nhẹ kết hợp tinh dầu oải hương hoặc sả chanh khuếch tán giải tỏa hệ phó giao cảm.	45	230000	\N	hoat_dong	0	\N	bo_sung	t	["Giải tỏa áp lực căng thẳng tinh thần, kích hoạt trạng thái thư giãn sâu của cơ thể.", "Cung cấp dưỡng chất thiên nhiên cao cấp làm dịu và phục hồi tế bào da."]
1ecbde7f-c01b-47da-b2f8-837cc53cc7cb	24	Xông Phục Hồi Cơ Thể	Dịch vụ Xông Phục Hồi Cơ Thể (Mã: ADD-STEAM-25)	Thư giãn xông hơi ướt 45 độ C cùng tinh chất thảo mộc bạc hà, sả chanh kích hoạt tuyến mồ hôi hoạt động.	25	130000	\N	hoat_dong	0	Phòng xông hơi	bo_sung	t	["Mở rộng lỗ chân lông đào thải muối dư và axit uric tích tụ trong cơ thể.", "Làm thông thông thoáng đường hô hấp, làm mềm màng cơ chuẩn bị tốt cho các buổi vận động."]
550aa3f7-7859-410b-b123-64ecc436cc5a	24	Massage Chân Phục Hồi	Dịch vụ Massage Chân Phục Hồi (Mã: ADD-FOOT-45)	Ấn huyệt phản xạ lòng bàn chân kết hợp massage giải co thắt cơ bắp chân và gót chân.	45	180000	\N	hoat_dong	0	\N	bo_sung	t	["Giảm đau mỏi gót chân gan bàn chân hiệu quả, giảm căng cứng cơ sinh đôi cẳng chân sau.", "Kích thích máu tĩnh mạch chi dưới lưu thông mượt mà tránh tê bì phù chân."]
1ad66d7b-0063-4632-a771-266515640173	24	Trị Liệu Ép Phục Hồi Cơ	Dịch vụ Trị Liệu Ép Phục Hồi Cơ (Mã: ADD-COMPRESS-25)	Khách hàng mang ủng nén hơi y khoa, máy ép tự động thực hiện bơm hơi cuộn dọc từ bàn chân lên đùi.	25	160000	\N	hoat_dong	0	Máy nén ép	bo_sung	t	["Tạo áp lực hơi ép xả thụ động hỗ trợ tĩnh mạch đẩy chất thải axit lactic ứ đọng đi nhanh hơn gấp 5 lần.", "Xóa tan chứng mỏi nặng chân nhanh chóng, thích hợp cho người đi đứng chạy bộ nhiều."]
5fe2af6e-1af3-4a4a-a4e7-95751fe9f900	22	Trải Nghiệm Thư Giãn Wellness Toàn Thân	Dịch vụ Trải Nghiệm Thư Giãn Wellness Toàn Thân (Mã: WELL-BODY-90)	Liệu pháp thư giãn phục hồi hệ bạch huyết: (1) Sử dụng tinh dầu cao cấp kích hoạt hệ khứu giác êm dịu; (2) Massage miết dài Thụy Điển nhẹ nhàng dọc cột sống kích hoạt hệ phó giao cảm; (3) Massage bấm huyệt da đầu giải tỏa căng cứng vỏ não; (4) Ủ đá nóng bazan hoặc chăn thảo dược ấm thải độc tuần hoàn bạch huyết.	90	500000	\N	hoat_dong	0	\N	chinh	t	["Đưa cơ thể về trạng thái tĩnh dưỡng sâu nhất, quét sạch hormone stress cortisol gây căng thẳng mệt mỏi.", "Kích thích hệ tuần hoàn bạch huyết hoạt động mạnh mẽ, hỗ trợ cơ thể thanh lọc đào thải độc tố cơ khớp.", "Xua tan uể oải tinh thần, cải thiện giấc ngủ sinh lý sâu và đem lại nguồn năng lượng tươi trẻ dồi dào."]
3793caaf-aac7-4fca-a205-e6304a54de3d	24	Giác Hơi Phục Hồi	Dịch vụ Giác Hơi Phục Hồi (Mã: ADD-CUPPING-40)	Đặt giác ống thủy tinh nóng y khoa lên vùng cơ thắt lưng và vai dày bằng giác hơi lửa chân không truyền thống.	40	180000	\N	hoat_dong	0	\N	bo_sung	t	["Tạo lực hút âm tách rời lớp mô liên kết cơ kết dính bóc tách xơ dính cơ lưng sâu rộng.", "Tăng lưu lượng tuần hoàn máu cục bộ tiêu ứ huyết, đào thải độc tố tích tụ gây mỏi lưng nặng."]
fc0ee8d2-f993-4838-8fe7-5a799d014534	24	Ngâm Đá Lạnh Phục Hồi	Dịch vụ Ngâm Đá Lạnh Phục Hồi (Mã: ADD-ICEBATH-12)	Khách hàng ngâm cơ thể hoặc chi dưới trong bể nước đá 8-12 độ C dưới sự giám sát nhịp thở y khoa của Kỹ thuật viên.	12	150000	\N	hoat_dong	0	Bể ngâm lạnh	bo_sung	t	["Co mạch đột ngột giảm ngay sưng đau cơ viêm cấp do tập luyện thể thao cường độ cao.", "Tái lập giãn nở mạch máu mạnh mẽ ngay sau khi kết thúc ngâm, đưa máu tươi oxy nuôi dưỡng cơ."]
980e41d8-b362-4ebb-a262-28dd906c63b7	24	Massage Đầu Cổ Vai Gáy	Dịch vụ Massage Đầu Cổ Vai Gáy (Mã: ADD-HEADNECK-40)	Day bấm cục bộ đai vai, cơ thang cổ và xoa bóp cơ da đầu xua tan mỏi đau tức thời.	40	200000	\N	hoat_dong	0	\N	bo_sung	t	["Giảm căng tức và cứng bả vai gáy do duy trì tư thế cúi gõ phím quá lâu.", "Cải thiện tuần hoàn động mạch não bộ, giảm dứt điểm chứng đau đầu do stress mỏi mệt."]
4433e0c7-7b81-4e67-8798-42de478c8c2f	24	Kéo Giãn Toàn Thân Chuyên Sâu	Dịch vụ Kéo Giãn Toàn Thân Chuyên Sâu (Mã: ADD-FULLSTR-45)	Kỹ thuật viên sử dụng lực kéo cơ học giãn toàn bộ chuỗi cơ sau, cơ liên sườn và khớp chân tay thụ động.	45	220000	\N	hoat_dong	0	\N	bo_sung	t	["Kéo giãn màng cân cơ bị co rút co cứng, đưa cơ thể về chiều dài sinh lý cân đối.", "Tăng tính linh hoạt đàn hồi khớp và phòng ngừa thoái hóa cứng cứng khớp."]
678a2d51-26be-47e4-88f9-65c55050691f	21	Khám lượng giá cột sống & tư thế	Dịch vụ Khám lượng giá cột sống & tư thế (Mã: SVC-KHAM)	Kỹ thuật viên thực hiện quy trình khám lượng giá gồm 5 bước tiêu chuẩn: (1) Khảo sát tư thế 4 chiều (trước, sau, bên trái, bên phải) bằng bàn dọi định vị để phát hiện lệch vai, lệch chậu, cổ nhô trước hoặc vẹo cột sống; (2) Sử dụng thước đo tầm vận động chuyên dụng đánh giá biên độ gập, duỗi, nghiêng, xoay cột sống; (3) Thực hiện nghiệm pháp Spurling chèn ép cổ, SLR test rễ thần kinh tọa và độ giãn thắt lưng; (4) Sờ chẩn xác định điểm đau nhức và vùng bó cơ co cứng; (5) Kết luận và thiết lập phác đồ trị liệu cá nhân hóa.	30	150000	\N	hoat_dong	0	\N	chinh	t	["Định vị chính xác nguyên nhân gốc rễ gây đau cơ xương khớp, loại trừ các nguy cơ bệnh lý thần kinh cột sống nguy hại.", "Phát hiện sớm các sai lệch tư thế vi mô (cổ rùa, lệch hông, bả vai cánh chim) để phòng ngừa thoái hóa sụn khớp sớm.", "Thiết lập thông số vận hành nền tảng giúp theo dõi và đánh giá chính xác tiến trình phục hồi qua từng buổi trị liệu."]
e624d46b-3c9e-4517-8450-0dd613bd1870	24	Trị Liệu Đá Nóng	Dịch vụ Trị Liệu Đá Nóng (Mã: ADD-HOTSTONE-50)	Đặt đá núi lửa bazan giữ nhiệt lâu dọc các huyệt đạo cột sống kết hợp trượt đá nóng làm giãn cơ co rút.	50	250000	\N	hoat_dong	0	\N	bo_sung	t	["Nhiệt lượng tỏa sâu làm giãn nở toàn bộ mao mạch, giải phóng các thớ cơ co cứng sâu bên trong thắt lưng.", "Sưởi ấm cơ thể khí huyết lưu thông tốt, cải thiện giấc ngủ ban đêm và xoa dịu thần kinh nhạy cảm."]
6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	22	Kéo giãn cột sống cổ bằng tay	Dịch vụ Kéo giãn cột sống cổ bằng tay (Mã: SVC-CST)	Kỹ thuật viên sử dụng lực tay chuyên môn thực hiện các kỹ thuật kéo giãn dọc trục cột sống cổ, di động nhẹ nhàng nhằm giải áp đĩa đệm vùng cổ vai gáy.	15	100000	\N	hoat_dong	0	\N	chinh	f	["Giải phóng chèn ép rễ thần kinh cổ, giảm nhanh chứng đau vai gáy lan xuống cánh tay.", "Phục hồi tầm vận động tự nhiên khi xoay, cúi, nghiêng cổ.", "Tăng cường lưu thông tuần hoàn máu não bộ, giảm đau đầu chóng mặt do chèn ép mạch."]
0c6db98f-e6e4-4c2f-a886-9f5f758d9908	23	Phục Hồi Sau Chấn Thương / Phẫu Thuật	Dịch vụ Phục Hồi Sau Chấn Thương / Phẫu Thuật (Mã: PT-POST-105)	Can thiệp an toàn theo tiêu chuẩn phục hồi y khoa: (1) Kiểm tra vết mổ và đánh giá teo cơ; (2) Massage bóc tách bao xơ sẹo mổ dưới da chống co rút kéo lệch khớp; (3) Di động khớp nhẹ nhàng thụ động ngăn cứng khớp sớm; (4) Điện kích thích cơ liệt chống teo cơ do bó bột hạn chế vận động; (5) Tập thăng bằng và phục hồi cảm thụ bản thể chân khớp.	105	1100000	\N	hoat_dong	0	\N	chinh	f	["Phá vỡ tổ chức xơ dính dưới sẹo mổ phẫu thuật, phòng ngừa tối đa xơ cứng bao khớp vĩnh viễn.", "Kích hoạt cơ bắp đang suy yếu teo nhỏ trở lại hoạt động bình thường, đẩy nhanh tiến trình hồi phục gấp đôi.", "Tái thiết lập hệ thống cảm nhận bản thể thần kinh cơ, giúp bước đi cân bằng tự nhiên không lệch lệch tư thế."]
\.


--
-- Data for Name: goi_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goi_dich_vu (id, ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, chi_tiet_dich_vu, thoi_gian_tao, danh_muc_id, loai_goi, so_dv_toi_da_moi_buoi) FROM stdin;
51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5	Cervical Spine Recovery (Trị Liệu Cổ Vai Gáy)	PKG-CVG	Liệu trình giảm đau mỏi vai gáy cho người làm việc máy tính nhiều, tái tạo vận động đốt sống cổ.	10	4000000	5000000	6	t	hoat_dong	[{"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "a7a9fbb2-cc2c-49f2-bfa1-592f15141eee", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "6bbd7899-0c05-4eff-a4b2-ea6273ffe91b", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 5, "so_lan_toi_da_trong_goi": 10}]	2026-05-24 07:53:39.323371	\N	lieu_trinh	5
4ee78af8-a832-4efc-a8c4-30acb88df83b	Lower Back Recovery (Trị Liệu Đau Lưng)	PKG-LBR	Hỗ trợ giải tỏa căng thẳng vùng thắt lưng, định hình tư thế ngồi, giảm nhức mỏi thắt lưng cấp và mãn tính.	10	4000000	5000000	6	t	hoat_dong	[{"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "bbb51293-b994-4a4f-91e1-e878ca9c502d", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 10}]	2026-05-24 07:53:39.337141	\N	lieu_trinh	5
61744394-b165-4dfa-bd68-d5604cc94593	Office Posture Correction (Chỉnh Dáng Văn Phòng)	PKG-OPC	Khắc phục tư thế cổ rùa, gù lưng, lệch khớp do ngồi sai tư thế nhiều năm.	12	4704000	5880000	6	t	hoat_dong	[{"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "e8f4278f-ef2c-42a9-8684-38aa3b93bfbe", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 12}, {"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "bbb51293-b994-4a4f-91e1-e878ca9c502d", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 12}, {"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "2053ea53-b173-4b40-9807-e265b9030ade", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 12}, {"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 12}]	2026-05-24 07:53:39.345153	\N	lieu_trinh	5
a77c470f-7a28-4a68-b645-4ce0d1f16746	Shoulder & Upper Back (Phục Hồi Khớp Vai)	PKG-SUR	Trị liệu căng cơ bả vai, khó giơ tay, mỏi vùng lưng trên do áp lực làm việc kéo dài.	10	4160000	5200000	6	t	hoat_dong	[{"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "a7a9fbb2-cc2c-49f2-bfa1-592f15141eee", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "a83e53d7-db1e-4c54-80d6-1bc012a2359b", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "2053ea53-b173-4b40-9807-e265b9030ade", "thu_tu_thuc_hien": 5, "so_lan_toi_da_trong_goi": 10}]	2026-05-24 07:53:39.353042	\N	lieu_trinh	5
31913ec2-eec3-4c0d-a473-a4f1b8644b44	Sciatica Relief (Giải Tỏa Đau Thần Kinh Tọa)	PKG-SCR	Tập trung giải phóng chèn ép rễ thần kinh lưng hông và mông, giúp đi lại linh hoạt.	10	4000000	5000000	6	t	hoat_dong	[{"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "a7a9fbb2-cc2c-49f2-bfa1-592f15141eee", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "ddf7dbe1-18e3-40d8-8ed7-4f9822a9e80a", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 5, "so_lan_toi_da_trong_goi": 10}]	2026-05-24 07:53:39.362973	\N	lieu_trinh	5
8f50330f-ad39-41de-9002-569497d66340	Wrist & Elbow Recovery (Trị Liệu Cổ Tay/Khuỷu Tay)	PKG-WER	Đặc trị hội chứng ống cổ tay, mỏi khớp ngón tay gõ phím, khuỷu tay tennis elbow.	8	3136000	3920000	6	t	hoat_dong	[{"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 8}, {"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 8}, {"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "2cd8d6a2-011d-4681-bed8-16db97962fb1", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 8}, {"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "270b0678-b61c-48c7-94d4-b8c1081b55d5", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 8}, {"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 5, "so_lan_toi_da_trong_goi": 8}]	2026-05-24 07:53:39.372839	\N	lieu_trinh	5
06326b0a-980f-4889-a9a4-b6284c1dfa28	Stress Recovery (Hồi Phục Căng Thẳng)	PKG-SRT	Liệu trình ngắn ngày kết hợp nhiệt và giải phóng cơ nông giúp ngủ ngon, giải tỏa mệt mỏi hệ thần kinh.	6	2064000	2580000	6	t	hoat_dong	[{"so_buoi": 6, "bat_buoc": true, "dich_vu_id": "e8f4278f-ef2c-42a9-8684-38aa3b93bfbe", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 6}, {"so_buoi": 6, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 6}]	2026-05-24 07:53:39.384538	\N	lieu_trinh	5
39bfa35a-439f-423a-aeb4-6b987ee370e9	Full Body Office Recovery (Trị Liệu Xương Khớp Toàn Thân)	PKG-FBR	Sự kết hợp hoàn hảo từ cột sống cổ đến thắt lưng, giúp cơ thể sảng khoái và tràn đầy năng lượng.	10	4000000	5000000	6	t	hoat_dong	[{"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "a7a9fbb2-cc2c-49f2-bfa1-592f15141eee", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "e8f4278f-ef2c-42a9-8684-38aa3b93bfbe", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "bbb51293-b994-4a4f-91e1-e878ca9c502d", "thu_tu_thuc_hien": 5, "so_lan_toi_da_trong_goi": 10}]	2026-05-24 07:53:39.390745	\N	lieu_trinh	5
40884a3e-3657-4e2b-b721-845e222a0ed4	Mobility & Flexibility (Tăng Cường Độ Linh Hoạt)	PKG-MFP	Kéo giãn và vận động khớp chủ động, lấy lại biên độ chuyển động tự nhiên cho cơ thể.	8	3200000	4000000	6	t	hoat_dong	[{"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "e8f4278f-ef2c-42a9-8684-38aa3b93bfbe", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 8}, {"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "a83e53d7-db1e-4c54-80d6-1bc012a2359b", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 8}, {"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "f53d9aca-6650-4e6c-8da1-999701dacb4b", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 8}, {"so_buoi": 8, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 8}]	2026-05-24 07:53:39.401359	\N	lieu_trinh	5
4b91e2ac-9243-4dba-8a44-1f3236583161	Preventive Office Care (Chăm Sóc Chủ Động)	PKG-PVC	Gói chăm sóc định kỳ hàng tuần ngăn ngừa thoái hóa đốt sống sớm cho quản lý và nhân viên.	12	3648000	4560000	6	t	hoat_dong	[{"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "e8f4278f-ef2c-42a9-8684-38aa3b93bfbe", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 12}, {"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 12}, {"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "a83e53d7-db1e-4c54-80d6-1bc012a2359b", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 12}, {"so_buoi": 12, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 12}]	2026-05-24 07:53:39.408349	\N	lieu_trinh	5
ffec32a7-bd0d-4239-b4f3-05941be0468f	Gói Phục Hồi Thoát Vị Đĩa Đệm & Thần Kinh Tọa Chuyên Sâu (10 Buổi)	PKG-LBR-SCI-10	Phác đồ chuẩn lâm sàng phục hồi cấu trúc đĩa đệm, giải áp cơ hình lê giải phóng dây thần kinh tọa bị chèn ép, thiết lập sự ổn định cột sống thắt lưng.	10	4500000	5550000	6	t	hoat_dong	[{"so_buoi": 1, "bat_buoc": true, "dich_vu_id": "678a2d51-26be-47e4-88f9-65c55050691f", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 1}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 10, "bat_buoc": true, "dich_vu_id": "a7a9fbb2-cc2c-49f2-bfa1-592f15141eee", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 10}, {"so_buoi": 5, "bat_buoc": true, "dich_vu_id": "ddf7dbe1-18e3-40d8-8ed7-4f9822a9e80a", "thu_tu_thuc_hien": 5, "so_lan_toi_da_trong_goi": 5}, {"so_buoi": 9, "bat_buoc": true, "dich_vu_id": "bbb51293-b994-4a4f-91e1-e878ca9c502d", "thu_tu_thuc_hien": 6, "so_lan_toi_da_trong_goi": 9}, {"so_buoi": 5, "bat_buoc": true, "dich_vu_id": "04459d03-a173-4aaf-b468-42281e48b7e9", "thu_tu_thuc_hien": 7, "so_lan_toi_da_trong_goi": 5}]	2026-05-24 08:27:35.927368	\N	lieu_trinh	5
608ef1b3-9a91-4d3b-8607-a36f1f0c3380	Gói Trị Liệu Cơ Xương Khớp Linh Động (Flexi-Care)	PKG-FLEXI-CARE	Giải pháp linh động tối ưu cho khách hàng. Số buổi quy định là 1 buổi kiểm soát, Kỹ thuật viên có thể kê đơn kết hợp linh động bất cứ dịch vụ kỹ thuật nào trong danh mục phù hợp nhất với thể trạng thực tế.	1	600000	600000	3	t	hoat_dong	[{"so_buoi": 5, "bat_buoc": false, "dich_vu_id": "a7a9fbb2-cc2c-49f2-bfa1-592f15141eee", "thu_tu_thuc_hien": 1, "so_lan_toi_da_trong_goi": 5}, {"so_buoi": 5, "bat_buoc": false, "dich_vu_id": "8de1ed6c-2311-453d-b7f2-ebed6e851f41", "thu_tu_thuc_hien": 2, "so_lan_toi_da_trong_goi": 5}, {"so_buoi": 5, "bat_buoc": false, "dich_vu_id": "880044bc-da2c-47e4-a8cf-c16aa319f3d1", "thu_tu_thuc_hien": 3, "so_lan_toi_da_trong_goi": 5}, {"so_buoi": 5, "bat_buoc": false, "dich_vu_id": "e8f4278f-ef2c-42a9-8684-38aa3b93bfbe", "thu_tu_thuc_hien": 4, "so_lan_toi_da_trong_goi": 5}, {"so_buoi": 5, "bat_buoc": false, "dich_vu_id": "6bbd7899-0c05-4eff-a4b2-ea6273ffe91b", "thu_tu_thuc_hien": 5, "so_lan_toi_da_trong_goi": 5}, {"so_buoi": 5, "bat_buoc": false, "dich_vu_id": "bbb51293-b994-4a4f-91e1-e878ca9c502d", "thu_tu_thuc_hien": 6, "so_lan_toi_da_trong_goi": 5}, {"so_buoi": 5, "bat_buoc": false, "dich_vu_id": "980e41d8-b362-4ebb-a262-28dd906c63b7", "thu_tu_thuc_hien": 7, "so_lan_toi_da_trong_goi": 5}]	2026-05-24 08:27:35.956835	\N	linh_dong	4
\.


--
-- Data for Name: goi_dich_vu_chi_tiet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goi_dich_vu_chi_tiet (id, goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi, so_lan_toi_da_trong_goi, bat_buoc, thu_tu_thuc_hien) FROM stdin;
120	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5	a7a9fbb2-cc2c-49f2-bfa1-592f15141eee	10	10	t	1
121	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5	8de1ed6c-2311-453d-b7f2-ebed6e851f41	10	10	t	2
122	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5	880044bc-da2c-47e4-a8cf-c16aa319f3d1	10	10	t	3
123	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	10	10	t	4
124	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5	04459d03-a173-4aaf-b468-42281e48b7e9	10	10	t	5
125	4ee78af8-a832-4efc-a8c4-30acb88df83b	8de1ed6c-2311-453d-b7f2-ebed6e851f41	10	10	t	1
126	4ee78af8-a832-4efc-a8c4-30acb88df83b	880044bc-da2c-47e4-a8cf-c16aa319f3d1	10	10	t	2
127	4ee78af8-a832-4efc-a8c4-30acb88df83b	bbb51293-b994-4a4f-91e1-e878ca9c502d	10	10	t	3
128	4ee78af8-a832-4efc-a8c4-30acb88df83b	04459d03-a173-4aaf-b468-42281e48b7e9	10	10	t	4
129	61744394-b165-4dfa-bd68-d5604cc94593	e8f4278f-ef2c-42a9-8684-38aa3b93bfbe	12	12	t	1
130	61744394-b165-4dfa-bd68-d5604cc94593	bbb51293-b994-4a4f-91e1-e878ca9c502d	12	12	t	2
131	61744394-b165-4dfa-bd68-d5604cc94593	2053ea53-b173-4b40-9807-e265b9030ade	12	12	t	3
132	61744394-b165-4dfa-bd68-d5604cc94593	04459d03-a173-4aaf-b468-42281e48b7e9	12	12	t	4
133	a77c470f-7a28-4a68-b645-4ce0d1f16746	a7a9fbb2-cc2c-49f2-bfa1-592f15141eee	10	10	t	1
134	a77c470f-7a28-4a68-b645-4ce0d1f16746	8de1ed6c-2311-453d-b7f2-ebed6e851f41	10	10	t	2
135	a77c470f-7a28-4a68-b645-4ce0d1f16746	880044bc-da2c-47e4-a8cf-c16aa319f3d1	10	10	t	3
136	a77c470f-7a28-4a68-b645-4ce0d1f16746	a83e53d7-db1e-4c54-80d6-1bc012a2359b	10	10	t	4
137	a77c470f-7a28-4a68-b645-4ce0d1f16746	2053ea53-b173-4b40-9807-e265b9030ade	10	10	t	5
138	31913ec2-eec3-4c0d-a473-a4f1b8644b44	a7a9fbb2-cc2c-49f2-bfa1-592f15141eee	10	10	t	1
139	31913ec2-eec3-4c0d-a473-a4f1b8644b44	8de1ed6c-2311-453d-b7f2-ebed6e851f41	10	10	t	2
140	31913ec2-eec3-4c0d-a473-a4f1b8644b44	880044bc-da2c-47e4-a8cf-c16aa319f3d1	10	10	t	3
141	31913ec2-eec3-4c0d-a473-a4f1b8644b44	ddf7dbe1-18e3-40d8-8ed7-4f9822a9e80a	10	10	t	4
142	31913ec2-eec3-4c0d-a473-a4f1b8644b44	04459d03-a173-4aaf-b468-42281e48b7e9	10	10	t	5
143	8f50330f-ad39-41de-9002-569497d66340	8de1ed6c-2311-453d-b7f2-ebed6e851f41	8	8	t	1
144	8f50330f-ad39-41de-9002-569497d66340	880044bc-da2c-47e4-a8cf-c16aa319f3d1	8	8	t	2
145	8f50330f-ad39-41de-9002-569497d66340	2cd8d6a2-011d-4681-bed8-16db97962fb1	8	8	t	3
146	8f50330f-ad39-41de-9002-569497d66340	270b0678-b61c-48c7-94d4-b8c1081b55d5	8	8	t	4
147	8f50330f-ad39-41de-9002-569497d66340	04459d03-a173-4aaf-b468-42281e48b7e9	8	8	t	5
148	06326b0a-980f-4889-a9a4-b6284c1dfa28	e8f4278f-ef2c-42a9-8684-38aa3b93bfbe	6	6	t	1
149	06326b0a-980f-4889-a9a4-b6284c1dfa28	880044bc-da2c-47e4-a8cf-c16aa319f3d1	6	6	t	2
150	39bfa35a-439f-423a-aeb4-6b987ee370e9	a7a9fbb2-cc2c-49f2-bfa1-592f15141eee	10	10	t	1
151	39bfa35a-439f-423a-aeb4-6b987ee370e9	e8f4278f-ef2c-42a9-8684-38aa3b93bfbe	10	10	t	2
152	39bfa35a-439f-423a-aeb4-6b987ee370e9	8de1ed6c-2311-453d-b7f2-ebed6e851f41	10	10	t	3
153	39bfa35a-439f-423a-aeb4-6b987ee370e9	880044bc-da2c-47e4-a8cf-c16aa319f3d1	10	10	t	4
154	39bfa35a-439f-423a-aeb4-6b987ee370e9	bbb51293-b994-4a4f-91e1-e878ca9c502d	10	10	t	5
155	40884a3e-3657-4e2b-b721-845e222a0ed4	e8f4278f-ef2c-42a9-8684-38aa3b93bfbe	8	8	t	1
156	40884a3e-3657-4e2b-b721-845e222a0ed4	a83e53d7-db1e-4c54-80d6-1bc012a2359b	8	8	t	2
157	40884a3e-3657-4e2b-b721-845e222a0ed4	f53d9aca-6650-4e6c-8da1-999701dacb4b	8	8	t	3
158	40884a3e-3657-4e2b-b721-845e222a0ed4	04459d03-a173-4aaf-b468-42281e48b7e9	8	8	t	4
159	4b91e2ac-9243-4dba-8a44-1f3236583161	e8f4278f-ef2c-42a9-8684-38aa3b93bfbe	12	12	t	1
160	4b91e2ac-9243-4dba-8a44-1f3236583161	880044bc-da2c-47e4-a8cf-c16aa319f3d1	12	12	t	2
161	4b91e2ac-9243-4dba-8a44-1f3236583161	a83e53d7-db1e-4c54-80d6-1bc012a2359b	12	12	t	3
162	4b91e2ac-9243-4dba-8a44-1f3236583161	04459d03-a173-4aaf-b468-42281e48b7e9	12	12	t	4
177	ffec32a7-bd0d-4239-b4f3-05941be0468f	678a2d51-26be-47e4-88f9-65c55050691f	1	1	t	1
178	ffec32a7-bd0d-4239-b4f3-05941be0468f	880044bc-da2c-47e4-a8cf-c16aa319f3d1	10	10	t	2
179	ffec32a7-bd0d-4239-b4f3-05941be0468f	8de1ed6c-2311-453d-b7f2-ebed6e851f41	10	10	t	3
180	ffec32a7-bd0d-4239-b4f3-05941be0468f	a7a9fbb2-cc2c-49f2-bfa1-592f15141eee	10	10	t	4
181	ffec32a7-bd0d-4239-b4f3-05941be0468f	ddf7dbe1-18e3-40d8-8ed7-4f9822a9e80a	5	5	t	5
182	ffec32a7-bd0d-4239-b4f3-05941be0468f	bbb51293-b994-4a4f-91e1-e878ca9c502d	9	9	t	6
183	ffec32a7-bd0d-4239-b4f3-05941be0468f	04459d03-a173-4aaf-b468-42281e48b7e9	5	5	t	7
184	608ef1b3-9a91-4d3b-8607-a36f1f0c3380	a7a9fbb2-cc2c-49f2-bfa1-592f15141eee	5	5	f	1
185	608ef1b3-9a91-4d3b-8607-a36f1f0c3380	8de1ed6c-2311-453d-b7f2-ebed6e851f41	5	5	f	2
186	608ef1b3-9a91-4d3b-8607-a36f1f0c3380	880044bc-da2c-47e4-a8cf-c16aa319f3d1	5	5	f	3
187	608ef1b3-9a91-4d3b-8607-a36f1f0c3380	e8f4278f-ef2c-42a9-8684-38aa3b93bfbe	5	5	f	4
188	608ef1b3-9a91-4d3b-8607-a36f1f0c3380	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	5	5	f	5
189	608ef1b3-9a91-4d3b-8607-a36f1f0c3380	bbb51293-b994-4a4f-91e1-e878ca9c502d	5	5	f	6
190	608ef1b3-9a91-4d3b-8607-a36f1f0c3380	980e41d8-b362-4ebb-a262-28dd906c63b7	5	5	f	7
\.


--
-- Data for Name: hoa_don; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hoa_don (id, ma_hoa_don, khach_hang_id, loai_hoa_don, tong_tien_truoc_giam, so_tien_giam, tong_tien_thanh_toan, da_thanh_toan, trang_thai, ghi_chu, ngay_tao, ngay_thanh_toan, thu_boi, loai_thanh_toan, voucher_id, so_tien_giam_voucher, so_tien_giam_phuong_thuc, lich_dieu_tri_id) FROM stdin;
3f4cd012-6a9b-440a-aeb9-3b0169713426	HD381425	cfd6e67f-99d2-49c7-9df1-309456c09cba	dich_vu_don	80000	0	80000	80000	da_thanh_toan	\N	2026-05-20 04:18:47.629	\N	\N	tra_thang	\N	0	0	\N
bd079107-44e7-44fc-a55f-f7183f056b7d	HD809111	76156dca-3449-4a93-9a8d-74a57eb58c7b	dich_vu_don	900000	0	900000	900000	da_thanh_toan	\N	2026-03-23 11:06:55.255	\N	\N	tra_thang	\N	0	0	\N
ce4a0914-5192-44fe-95d1-cb5b9de2ae47	HD093758	e8595e34-27a1-4fbf-b576-62a2bf3a690a	dich_vu_don	80000	0	80000	80000	da_thanh_toan	\N	2026-02-09 19:00:33.785	\N	\N	tra_thang	\N	0	0	\N
09878aff-a78c-438d-bd5c-93fca21e0832	HD250191	b251333e-0a2a-4bbb-980e-b704658b8900	dich_vu_don	450000	0	450000	450000	da_thanh_toan	\N	2025-12-02 10:01:52.226	\N	\N	tra_thang	\N	0	0	\N
162b989c-f085-45bd-b3ea-0a7b9e7f64d6	HD079143	69267ba5-17ab-4cf7-84c3-9b16e07141f3	dich_vu_don	800000	0	800000	800000	da_thanh_toan	\N	2025-12-17 07:29:10.271	\N	\N	tra_thang	\N	0	0	\N
8e68789d-2bce-46ee-a4f3-e24269b93b80	HD124503	9d39568a-1fcd-45fd-a4ec-218ce1947738	dich_vu_don	230000	0	230000	230000	da_thanh_toan	\N	2026-03-19 13:40:59.191	\N	\N	tra_thang	\N	0	0	\N
03629108-7b91-410c-aa6b-b604bcd7aa51	HD961309	76156dca-3449-4a93-9a8d-74a57eb58c7b	dich_vu_don	120000	0	120000	120000	da_thanh_toan	\N	2025-12-10 19:44:58.659	\N	\N	tra_thang	\N	0	0	\N
7de5ddf7-40aa-4561-8604-51322a403550	HD063824	707cbd97-d471-4d4b-b799-7d66946df687	dich_vu_don	230000	0	230000	230000	da_thanh_toan	\N	2026-03-31 20:55:19.431	\N	\N	tra_thang	\N	0	0	\N
8cae457a-2063-4bd7-80af-55fcd465cd8c	HD281431	707cbd97-d471-4d4b-b799-7d66946df687	dich_vu_don	120000	0	120000	120000	da_thanh_toan	\N	2026-05-06 00:29:15.01	\N	\N	tra_thang	\N	0	0	\N
aef217ad-98fa-4ce3-9a9f-df1e1c6f3a58	HD089992	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	dich_vu_don	150000	0	150000	150000	da_thanh_toan	\N	2025-12-02 09:09:25.632	\N	\N	tra_thang	\N	0	0	\N
d1c597a8-8a11-4ffc-8f91-130ce8e71796	HD500617	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_don	120000	0	120000	120000	da_thanh_toan	\N	2026-03-14 07:11:09.185	\N	\N	tra_thang	\N	0	0	\N
1d015035-5b00-4d70-b3c8-f0e19a144852	HD557824	bcea21d1-648e-4072-a6a1-89130918d06c	dich_vu_don	120000	0	120000	120000	da_thanh_toan	\N	2026-03-03 02:33:31.675	\N	\N	tra_thang	\N	0	0	\N
7349c3c7-6204-4b62-95ef-dd2263973e1b	HD589942	69267ba5-17ab-4cf7-84c3-9b16e07141f3	dich_vu_don	100000	0	100000	100000	da_thanh_toan	\N	2026-03-15 18:39:34.182	\N	\N	tra_thang	\N	0	0	\N
4e39687a-5cbe-43ea-bf7b-a8e7a3285c41	HD922043	cda19bc9-282e-4a71-9878-7641480e6f11	dich_vu_don	450000	0	450000	450000	da_thanh_toan	\N	2026-03-10 21:43:18.861	\N	\N	tra_thang	\N	0	0	\N
eb8452f4-365f-4909-a810-d9264cfc7840	HD285040	0a8e9fa8-e68f-4de2-833c-4a722ac64414	dich_vu_don	250000	0	250000	250000	da_thanh_toan	\N	2026-02-17 15:16:37.742	\N	\N	tra_thang	\N	0	0	\N
dd82d817-41ba-413f-a33e-1009570e5bb2	HD110302	9d39568a-1fcd-45fd-a4ec-218ce1947738	dich_vu_don	250000	0	250000	250000	da_thanh_toan	\N	2025-11-26 16:50:38.552	\N	\N	tra_thang	\N	0	0	\N
efed2180-6f22-4c3f-8ee8-c6ceacb0845e	HD683370	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	dich_vu_don	120000	0	120000	120000	da_thanh_toan	\N	2026-02-08 08:22:29.891	\N	\N	tra_thang	\N	0	0	\N
82e9458a-e026-40e3-9739-b2309e706f54	HD249428	76156dca-3449-4a93-9a8d-74a57eb58c7b	dich_vu_don	100000	0	100000	100000	da_thanh_toan	\N	2026-04-16 06:13:45.265	\N	\N	tra_thang	\N	0	0	\N
6e2b04ad-c59e-41a4-aa05-105f4ae0ed7d	HD079249	0a8e9fa8-e68f-4de2-833c-4a722ac64414	dich_vu_don	80000	0	80000	80000	da_thanh_toan	\N	2026-01-09 14:00:37.426	\N	\N	tra_thang	\N	0	0	\N
656ea046-3e6a-450d-b2c7-506926d95496	HD857781	bcea21d1-648e-4072-a6a1-89130918d06c	dich_vu_don	250000	0	250000	250000	da_thanh_toan	\N	2026-05-01 09:36:45.533	\N	\N	tra_thang	\N	0	0	\N
55b21839-6c4e-42a9-9eef-6355552282c3	HD147272	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	dich_vu_don	650000	0	650000	650000	da_thanh_toan	\N	2025-12-20 14:52:16.254	\N	\N	tra_thang	\N	0	0	\N
7db8b83b-6047-4d3e-90f0-4ce4ac5af27a	HD633894	cfd6e67f-99d2-49c7-9df1-309456c09cba	dich_vu_don	200000	0	200000	200000	da_thanh_toan	\N	2026-04-08 05:58:13.561	\N	\N	tra_thang	\N	0	0	\N
57ce186c-9dc9-45fe-b6d0-69902f62df1e	HD214693	cda19bc9-282e-4a71-9878-7641480e6f11	dich_vu_don	180000	0	180000	180000	da_thanh_toan	\N	2025-12-29 01:00:24.655	\N	\N	tra_thang	\N	0	0	\N
cd9854f2-ce1d-469a-8094-4a4e53dd3e6f	HD516053	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_don	180000	0	180000	180000	da_thanh_toan	\N	2026-01-08 14:48:23.144	\N	\N	tra_thang	\N	0	0	\N
3bae13c9-7969-4ea1-be80-7ea0c7dfe0d1	HD260099	0ed53f57-99d9-47c7-9652-23366e7ff8dc	dich_vu_don	650000	0	650000	650000	da_thanh_toan	\N	2025-12-13 18:48:23.695	\N	\N	tra_thang	\N	0	0	\N
60a9ff84-7b69-456f-9c32-498749cad57e	HD595303	76156dca-3449-4a93-9a8d-74a57eb58c7b	dich_vu_don	230000	0	230000	230000	da_thanh_toan	\N	2025-11-29 05:58:43.661	\N	\N	tra_thang	\N	0	0	\N
f6d935db-55f5-4a11-99ce-f961ff06db8d	HD823422	0ed53f57-99d9-47c7-9652-23366e7ff8dc	dich_vu_don	150000	0	150000	150000	da_thanh_toan	\N	2026-04-13 03:04:27.897	\N	\N	tra_thang	\N	0	0	\N
24167dd2-0f9e-4ca7-bafd-8044e6e9abae	HD071926	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	dich_vu_don	80000	0	80000	80000	da_thanh_toan	\N	2026-03-01 06:41:17.726	\N	\N	tra_thang	\N	0	0	\N
e394780d-79d7-485b-8c22-1c08d69bfe46	HD730327	bcea21d1-648e-4072-a6a1-89130918d06c	dich_vu_don	350000	0	350000	350000	da_thanh_toan	\N	2025-12-08 10:54:32.817	\N	\N	tra_thang	\N	0	0	\N
42d2635f-fba1-4cf3-bb75-fc18b6c85b10	HD084918	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_don	450000	0	450000	450000	da_thanh_toan	\N	2026-04-29 17:45:26.999	\N	\N	tra_thang	\N	0	0	\N
434e31fd-8982-4d59-a7b1-2ca02d7fc955	HD631252	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	dich_vu_don	80000	0	80000	80000	da_thanh_toan	\N	2026-02-25 02:07:49.954	\N	\N	tra_thang	\N	0	0	\N
041a8858-3a16-44fe-b530-df1e328c1cf5	HD041491	22df556e-72f8-478d-87be-e35d31569305	dich_vu_don	350000	0	350000	350000	da_thanh_toan	\N	2025-12-07 10:32:39.298	\N	\N	tra_thang	\N	0	0	\N
8f937abd-1eeb-44a4-8576-d35ddd0dedfc	HD963421	0ed53f57-99d9-47c7-9652-23366e7ff8dc	dich_vu_don	150000	0	150000	150000	da_thanh_toan	\N	2025-12-26 10:13:39.401	\N	\N	tra_thang	\N	0	0	\N
2dfd8ed4-4dec-4577-9448-3b9e69fe31a9	HD495927	dbb444ac-d3e2-4e99-95e1-4951064ec20c	dich_vu_don	1100000	0	1100000	1100000	da_thanh_toan	\N	2026-01-11 12:25:26.647	\N	\N	tra_thang	\N	0	0	\N
82b76da5-948a-4be4-a479-78d718ed85ae	HD948062	7f56ecf7-6802-4b55-a9ee-b00232358176	dich_vu_don	120000	0	120000	120000	da_thanh_toan	\N	2026-03-16 01:27:24.676	\N	\N	tra_thang	\N	0	0	\N
89a8799f-0dc8-42bc-9b20-fba632b11017	HD780021	9d39568a-1fcd-45fd-a4ec-218ce1947738	dich_vu_don	300000	0	300000	300000	da_thanh_toan	\N	2025-12-09 21:49:41.402	\N	\N	tra_thang	\N	0	0	\N
a455fc7b-8952-4051-9869-b91e1ace7da5	HD749988	b251333e-0a2a-4bbb-980e-b704658b8900	dich_vu_don	900000	0	900000	900000	da_thanh_toan	\N	2026-02-04 07:16:59.799	\N	\N	tra_thang	\N	0	0	\N
b470c3f6-0548-47d8-ae76-a631592ad9fd	HD608949	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_don	350000	0	350000	350000	da_thanh_toan	\N	2026-02-27 03:11:20.364	\N	\N	tra_thang	\N	0	0	\N
f2636b76-dc74-4c1f-9df7-c4ecfa358e64	HD631765	0a8e9fa8-e68f-4de2-833c-4a722ac64414	dich_vu_don	150000	0	150000	150000	da_thanh_toan	\N	2026-01-19 07:38:38.763	\N	\N	tra_thang	\N	0	0	\N
9fa820fc-cf54-4bde-b5d5-d2ec0c485ea7	HD002634	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_don	180000	0	180000	180000	da_thanh_toan	\N	2026-05-11 16:48:36.112	\N	\N	tra_thang	\N	0	0	\N
45b0c333-7c7a-47db-b9b8-503266d1d040	HD868545	707cbd97-d471-4d4b-b799-7d66946df687	dich_vu_don	220000	0	220000	220000	da_thanh_toan	\N	2026-04-04 06:24:27.071	\N	\N	tra_thang	\N	0	0	\N
219a9be7-2953-4c92-bd25-11408f82fb2c	HD047181	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_don	130000	0	130000	130000	da_thanh_toan	\N	2026-01-23 08:21:56.753	\N	\N	tra_thang	\N	0	0	\N
b6be0a55-c220-4104-816f-46ec238c55c9	HD399556	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	dich_vu_don	100000	0	100000	100000	da_thanh_toan	\N	2025-11-27 16:40:38.108	\N	\N	tra_thang	\N	0	0	\N
08ffb568-62a5-4ec2-af2a-900df1cf5a20	HD168218	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	dich_vu_don	100000	0	100000	100000	da_thanh_toan	\N	2025-12-07 21:54:42.959	\N	\N	tra_thang	\N	0	0	\N
7a0ac2e4-87c8-4389-8c52-d9d82a6f31d4	HD510893	0a8e9fa8-e68f-4de2-833c-4a722ac64414	dich_vu_don	400000	0	400000	400000	da_thanh_toan	\N	2026-04-14 11:45:39.705	\N	\N	tra_thang	\N	0	0	\N
3fe2cb56-f05b-49e3-9e2c-0e6c91e878c0	HD804552	0a8e9fa8-e68f-4de2-833c-4a722ac64414	dich_vu_don	180000	0	180000	180000	da_thanh_toan	\N	2026-04-23 22:50:12.462	\N	\N	tra_thang	\N	0	0	\N
23da7b85-4eec-48d0-bcdf-0968799d8f94	HD467411	7ba87b5a-720e-4502-9057-cee106e17cc6	dich_vu_don	180000	0	180000	180000	da_thanh_toan	\N	2025-12-10 10:12:19.768	\N	\N	tra_thang	\N	0	0	\N
2a0b6903-c67e-41a9-a9b6-3c9d39f3450d	HD016861	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_don	120000	0	120000	120000	da_thanh_toan	\N	2026-03-08 22:43:48.353	\N	\N	tra_thang	\N	0	0	\N
edb555f5-bc56-42f5-bfd5-3b3c1ce2b0dd	HD695739	707cbd97-d471-4d4b-b799-7d66946df687	dich_vu_don	230000	0	230000	230000	da_thanh_toan	\N	2026-05-11 21:44:08.923	\N	\N	tra_thang	\N	0	0	\N
ebd136c3-47ed-4342-8369-82605fd89a36	HD283904	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	dich_vu_don	100000	0	100000	100000	da_thanh_toan	\N	2026-04-28 05:49:34.147	\N	\N	tra_thang	\N	0	0	\N
9989e773-a17e-4814-b532-bfc1781771c3	HD930154	7f56ecf7-6802-4b55-a9ee-b00232358176	dich_vu_don	120000	0	120000	200000	da_thanh_toan	Khách không hài lòng gói: Khách có việc	2026-05-26 22:31:53.423751	2026-05-26 22:32:43.938083	\N	tra_thang	\N	0	0	0a6065c9-524f-4ce4-a341-039eb69ea986
\.


--
-- Data for Name: khach_hang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khach_hang (id, nguoi_dung_id, ngay_sinh, gioi_tinh, dia_chi, hang_khach_hang, preferred_ktv_id, thoi_gian_tao, deleted_at, so_cccd) FROM stdin;
7f56ecf7-6802-4b55-a9ee-b00232358176	15721d01-1496-44d9-b438-ec932a6f9901	1960-11-13	nam	\N	thuong	\N	2026-05-24 07:53:39.159522	\N	\N
e8595e34-27a1-4fbf-b576-62a2bf3a690a	762e79c0-3bde-4b59-bbb4-cb8744c91b94	1990-03-04	nu	\N	vang	\N	2026-05-24 07:53:39.166583	\N	\N
172f241c-6a22-4270-87d3-2736e0471ad6	f08b746b-06da-4edc-93c0-ac3fbb632e6c	2001-08-27	nam	\N	bac	\N	2026-05-24 07:53:39.170325	\N	\N
9d39568a-1fcd-45fd-a4ec-218ce1947738	636423b1-c14d-4ea4-8558-8f8f8b54420e	1988-02-26	nam	\N	vang	\N	2026-05-24 07:53:39.175118	\N	\N
707cbd97-d471-4d4b-b799-7d66946df687	694f7c3b-a9be-4567-99e8-deb4038a798b	1985-12-16	nam	\N	bac	\N	2026-05-24 07:53:39.179724	\N	\N
cfd6e67f-99d2-49c7-9df1-309456c09cba	0490eade-0963-4fa8-ad01-9c8f92793c16	1996-02-28	nam	\N	bac	\N	2026-05-24 07:53:39.183716	\N	\N
22df556e-72f8-478d-87be-e35d31569305	b70160d6-8d8d-4519-ac57-2cdb82031460	1990-03-21	nu	\N	thuong	\N	2026-05-24 07:53:39.186966	\N	\N
7ba87b5a-720e-4502-9057-cee106e17cc6	16e1d38f-08bd-48b8-b4ea-1e210437f377	1992-09-20	nam	\N	bac	\N	2026-05-24 07:53:39.190641	\N	\N
06de6d10-2ed1-4401-beaa-2814bd97a233	5b24f1fd-29fc-4f0a-b262-42a0e6b3346f	1975-10-31	nam	\N	vang	\N	2026-05-24 07:53:39.194261	\N	\N
4fe13e5e-2fa1-4ba7-b31a-67ea75086912	f52c830e-ee0d-41f9-893a-907cb316d019	2007-09-09	nu	\N	vang	\N	2026-05-24 07:53:39.198785	\N	\N
76156dca-3449-4a93-9a8d-74a57eb58c7b	9c7c4824-a74b-4945-811f-07e6785993bf	1973-02-28	nam	\N	bac	\N	2026-05-24 07:53:39.203458	\N	\N
0a8e9fa8-e68f-4de2-833c-4a722ac64414	3c249cb2-8837-4990-b4b8-ac275ede3ff2	1973-05-04	nam	\N	bac	\N	2026-05-24 07:53:39.207334	\N	\N
69267ba5-17ab-4cf7-84c3-9b16e07141f3	7e771d27-063a-4991-90e0-3ead6a345524	1994-01-06	nam	\N	bac	\N	2026-05-24 07:53:39.211795	\N	\N
b251333e-0a2a-4bbb-980e-b704658b8900	6aa5c0b8-5bdd-4e21-829d-83e901b97f95	2002-06-01	nu	\N	thuong	\N	2026-05-24 07:53:39.216216	\N	\N
0ed53f57-99d9-47c7-9652-23366e7ff8dc	fc413e3e-6f0f-4c17-ac46-8a5c257414d3	1980-02-07	nu	\N	vang	\N	2026-05-24 07:53:39.220162	\N	\N
cda19bc9-282e-4a71-9878-7641480e6f11	a0d020ae-af0c-4fd7-90a7-81d40d79c7d3	2000-09-24	nam	\N	bac	\N	2026-05-24 07:53:39.224677	\N	\N
4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	35b5f8fc-ea59-4b49-bc2e-718f0e72d41f	1971-06-18	nam	\N	thuong	\N	2026-05-24 07:53:39.228846	\N	\N
bcea21d1-648e-4072-a6a1-89130918d06c	9792fb53-5155-4a7a-8333-fb53b6894b2f	1960-10-30	nam	\N	vang	\N	2026-05-24 07:53:39.232681	\N	\N
e432229f-347c-44d5-89ed-c17f453ccf6a	320ba88b-2f0c-40af-93dc-bcd09b3b3f5d	1962-12-09	nam	\N	thuong	\N	2026-05-24 07:53:39.236318	\N	\N
dbb444ac-d3e2-4e99-95e1-4951064ec20c	08245f5f-3203-4253-80ad-dcbf26caaea9	1983-02-27	nu	\N	bac	\N	2026-05-24 07:53:39.23976	\N	\N
\.


--
-- Data for Name: lich_dat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url, trang_thai, ghi_chu_dat_lich, ghi_chu_noi_bo, thoi_gian_checkin, thoi_gian_huy, ly_do_huy, nguoi_tao, thoi_gian_tao, chan_doan, chong_chi_dinh, khuyen_nghi_dich_vu_id, khuyen_nghi_goi_id) FROM stdin;
32214883-ff05-4152-81d2-882b9095ec1d	LD914531	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-24 07:53:39.60556	2026-05-24 08:53:39.60556	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.60556	\N	\N	\N	\N
f80568fe-8123-4e7b-a89d-792126f832b7	LD874323	e432229f-347c-44d5-89ed-c17f453ccf6a	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-23 07:53:39.620897	2026-05-23 08:53:39.620897	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.620897	\N	\N	\N	\N
c0c4108b-d402-4fb3-832a-58ed30dbba0d	LD526398	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-22 07:53:39.628993	2026-05-22 08:53:39.628993	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.628993	\N	\N	\N	\N
a1e88b6a-3312-49ad-8362-203b4719fe62	LD923060	0a8e9fa8-e68f-4de2-833c-4a722ac64414	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-21 07:53:39.636758	2026-05-21 08:53:39.636758	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.636758	\N	\N	\N	\N
761d7bf9-d4c2-416b-a896-03e06018aefa	LD710750	172f241c-6a22-4270-87d3-2736e0471ad6	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-20 07:53:39.6425	2026-05-20 08:53:39.6425	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.6425	\N	\N	\N	\N
88868b10-07cd-43d4-98c6-c6e457fdcb4b	LD396886	cda19bc9-282e-4a71-9878-7641480e6f11	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-19 07:53:39.648348	2026-05-19 08:53:39.648348	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.648348	\N	\N	\N	\N
efee1195-cad4-4f1c-a941-b96c8578264d	LD557177	69267ba5-17ab-4cf7-84c3-9b16e07141f3	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-18 07:53:39.655065	2026-05-18 08:53:39.655065	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.655065	\N	\N	\N	\N
002cbf50-ed09-44af-a61a-a8c693d48085	LD918900	22df556e-72f8-478d-87be-e35d31569305	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-17 07:53:39.661996	2026-05-17 08:53:39.661996	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.661996	\N	\N	\N	\N
4fabe19e-b39d-4161-80ba-b744bbaa76ff	LD558270	22df556e-72f8-478d-87be-e35d31569305	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-16 07:53:39.667469	2026-05-16 08:53:39.667469	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.667469	\N	\N	\N	\N
9b3b710b-7efe-4382-9a40-e07c43e3815d	LD658147	cfd6e67f-99d2-49c7-9df1-309456c09cba	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-15 07:53:39.673028	2026-05-15 08:53:39.673028	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.673028	\N	\N	\N	\N
4db66cfd-3c6d-43aa-86c2-44fcfd8b3179	LD711830	7ba87b5a-720e-4502-9057-cee106e17cc6	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-14 07:53:39.679999	2026-05-14 08:53:39.679999	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.679999	\N	\N	\N	\N
a42913e8-1368-48d4-a620-46643602c211	LD474961	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-13 07:53:39.685668	2026-05-13 08:53:39.685668	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.685668	\N	\N	\N	\N
8239c356-fbc9-4708-92fb-f39d1c926460	LD453132	e432229f-347c-44d5-89ed-c17f453ccf6a	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-12 07:53:39.691523	2026-05-12 08:53:39.691523	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.691523	\N	\N	\N	\N
8fdc7e49-d984-4be3-88f0-cceaacf27c25	LD876056	bcea21d1-648e-4072-a6a1-89130918d06c	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-11 07:53:39.696895	2026-05-11 08:53:39.696895	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.696895	\N	\N	\N	\N
dd3b89cc-a0f4-4256-9f8a-82d965dcddeb	LD365718	dbb444ac-d3e2-4e99-95e1-4951064ec20c	\N	\N	\N	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	\N	2026-05-10 07:53:39.702384	2026-05-10 08:53:39.702384	\N	\N	hoan_thanh	\N	\N	\N	\N	\N	khach_hang	2026-05-24 07:53:39.702384	\N	\N	\N	\N
\.


--
-- Data for Name: lich_dieu_tri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_dieu_tri (id, khach_hang_id, loai_dieu_tri, dich_vu_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, thoi_gian_tao, ma_lich_dieu_tri, phong_id, ho_ten_khach, so_dien_thoai, ghi_chu_noi_bo, lich_dat_id, ngay_bat_dau, ngay_ket_thuc) FROM stdin;
5430402b-f039-4cd4-9cdf-61b01a2b2599	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.610367	\N	\N	\N	\N	\N	\N	\N	\N
a27ef709-9821-4aae-8f25-8f2319a36b3d	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.622612	\N	\N	\N	\N	\N	\N	\N	\N
0b5f3114-ef48-44d0-bbdf-e427926e4417	4ec5b5d7-79d3-4d79-80d0-ac5388c6b184	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.631322	\N	\N	\N	\N	\N	\N	\N	\N
224daf0e-cdfa-4a88-ac22-53f91ee5de0f	0a8e9fa8-e68f-4de2-833c-4a722ac64414	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.638201	\N	\N	\N	\N	\N	\N	\N	\N
9f35acc6-2653-4427-ad43-7c583e7d440b	172f241c-6a22-4270-87d3-2736e0471ad6	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.64397	\N	\N	\N	\N	\N	\N	\N	\N
9817c27e-27f3-475f-9f8c-2f612e9949e4	cda19bc9-282e-4a71-9878-7641480e6f11	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.649819	\N	\N	\N	\N	\N	\N	\N	\N
9362b568-b2bf-4ed3-8e39-cf526dd056a0	69267ba5-17ab-4cf7-84c3-9b16e07141f3	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.656758	\N	\N	\N	\N	\N	\N	\N	\N
5539b55e-3ec2-4ec2-ae6e-c6bbe5b20fcf	22df556e-72f8-478d-87be-e35d31569305	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.663357	\N	\N	\N	\N	\N	\N	\N	\N
c6496803-4937-459c-93cf-aa45a4d1d936	22df556e-72f8-478d-87be-e35d31569305	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.668854	\N	\N	\N	\N	\N	\N	\N	\N
103eeaef-ebf2-45ce-b447-4cd0721c8c72	cfd6e67f-99d2-49c7-9df1-309456c09cba	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.674632	\N	\N	\N	\N	\N	\N	\N	\N
7c82d911-e991-4512-aa0a-90a60a385f15	7ba87b5a-720e-4502-9057-cee106e17cc6	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.681433	\N	\N	\N	\N	\N	\N	\N	\N
a68836f8-8c77-4f65-a901-10198e2cb10f	4fe13e5e-2fa1-4ba7-b31a-67ea75086912	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.68721	\N	\N	\N	\N	\N	\N	\N	\N
6083b843-433a-4cef-b8ef-b5858b9b97e8	e432229f-347c-44d5-89ed-c17f453ccf6a	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.692916	\N	\N	\N	\N	\N	\N	\N	\N
93139688-f47f-4b66-b897-a5b2bf719ead	bcea21d1-648e-4072-a6a1-89130918d06c	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.698165	\N	\N	\N	\N	\N	\N	\N	\N
1a417e1c-0518-4b42-916f-d52ad120f3c7	dbb444ac-d3e2-4e99-95e1-4951064ec20c	dich_vu_le	6bbd7899-0c05-4eff-a4b2-ea6273ffe91b	\N	1	1	hoan_thanh	2026-05-24 07:53:39.703758	\N	\N	\N	\N	\N	\N	\N	\N
0a6065c9-524f-4ce4-a341-039eb69ea986	7f56ecf7-6802-4b55-a9ee-b00232358176	dich_vu_le	\N	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5	1	1	da_thanh_toan	2026-05-26 21:39:55.763851	LDT-TESTGOI01	37	Tuấn Khải Phan	0248 1408 1678	\N	\N	2026-05-26 21:39:55.763851	2026-06-25 21:39:55.763851
\.


--
-- Data for Name: lich_lam_viec; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_lam_viec (id, nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) FROM stdin;
900bf1fe-d5c9-433e-a757-d693ff194b14	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-18	08:00:00	17:00:00	hoat_dong
7d764085-81c3-480b-94ef-08d1ec3d9075	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-19	08:00:00	17:00:00	hoat_dong
58e8b715-451a-4400-860a-88d960efb009	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-20	08:00:00	17:00:00	hoat_dong
cbe98db7-d141-44b1-a07f-911895092838	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-21	08:00:00	17:00:00	hoat_dong
3dde0f4e-606c-4cf6-b5e1-1a770022a0bc	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-22	08:00:00	17:00:00	hoat_dong
d962aec8-4079-4dde-880b-8be03c6c9a0b	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-23	08:00:00	12:00:00	hoat_dong
ab087207-aaa1-4125-8ad6-8cea069dec60	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-18	08:30:00	12:00:00	hoat_dong
7fe5c250-acf1-4068-b998-73e67c7b9ade	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-19	08:30:00	12:00:00	hoat_dong
57a13f67-b39e-47d2-ae2d-e7f90e1bbdcb	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-20	08:30:00	12:00:00	hoat_dong
27ea9ed3-8bc3-4de8-921f-bc1a5e538642	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-21	13:30:00	17:30:00	hoat_dong
40298698-42a8-429e-8ba7-5cb090977894	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-22	13:30:00	17:30:00	hoat_dong
e0e44040-5c7a-4061-84d7-5095e615db58	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-23	13:30:00	17:30:00	hoat_dong
5e98200a-47e1-40b3-86be-291aba41498a	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-18	13:00:00	17:00:00	hoat_dong
e7d9094d-e5c7-4a05-9524-fd9f5a6d3bcb	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-19	13:00:00	17:00:00	hoat_dong
f5a9a1a3-52d5-496f-b27b-845b488ec95d	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-20	13:00:00	17:00:00	hoat_dong
9b52d10b-fdf4-4c95-9c2e-3271fa1e52ed	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-21	13:00:00	17:00:00	hoat_dong
446ab7f3-a278-4c2a-bd8b-702f648086fd	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-22	13:00:00	17:00:00	hoat_dong
535e395f-8924-4c27-bbc4-70a0f626e699	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-18	08:00:00	12:00:00	hoat_dong
fff33872-3f65-4782-9dfd-c30031f519e1	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-19	08:00:00	12:00:00	hoat_dong
bbafd2ff-e005-4735-9480-3da342ad090d	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-20	08:00:00	12:00:00	hoat_dong
a5997ed5-7667-471b-a23d-72a41869c2cf	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-21	13:00:00	17:00:00	hoat_dong
8514588a-1330-48bf-bd33-12ac44098755	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-22	13:00:00	17:00:00	hoat_dong
33027f64-213a-4e34-a85e-5315b4767a58	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-18	13:00:00	17:00:00	hoat_dong
4401a9c0-96da-4505-adeb-4aabcce79eaf	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-19	13:00:00	17:00:00	hoat_dong
fbe5c7c4-2e8b-4087-ac3f-b10a59cd7abc	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-23	13:00:00	17:00:00	hoat_dong
979cc7cf-f9d7-4822-ad6f-6b5814462522	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-20	08:00:00	17:00:00	tam_nghi
fb2835eb-61f4-40cf-a67e-454a598180ba	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-21	08:00:00	17:00:00	tam_nghi
144275c4-7d85-416b-b39e-d14b5a4a41b9	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-25	08:00:00	17:00:00	hoat_dong
a48eec6e-c340-4d50-8e50-29363d81807f	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-26	08:00:00	17:00:00	hoat_dong
133430c0-af67-4cbf-8657-e5aefd9b9142	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-28	08:00:00	17:00:00	hoat_dong
cfae6077-5773-40d1-b230-94168a6bb959	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-29	08:00:00	17:00:00	hoat_dong
fc9f5663-2aec-4985-a8a4-559d5a4146df	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-27	08:00:00	17:00:00	tam_nghi
1fe98775-653b-464b-b897-5b073115593a	d9b938c3-529a-4025-a04f-13d842839b52	2026-05-30	17:00:00	21:00:00	hoat_dong
f81bad6e-8823-45a0-b047-408d4932e95e	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-25	08:30:00	12:00:00	hoat_dong
8ee045e6-2f47-4e71-87eb-511170a35d07	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-27	08:30:00	12:00:00	hoat_dong
150d3787-bacc-4d18-bd83-ad5abe16a95d	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-29	08:30:00	12:00:00	hoat_dong
340eda88-a104-4842-abe1-4356f3bfb32a	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-26	17:30:00	21:30:00	hoat_dong
b38000cb-9b75-4461-9975-056b0f2b6001	c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	2026-05-28	17:30:00	21:30:00	hoat_dong
45158c5c-015e-4556-a11a-fe50a00c59aa	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-25	17:00:00	21:00:00	hoat_dong
44fa75e7-fdf2-404e-978f-595de8ddb7de	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-26	17:00:00	21:00:00	hoat_dong
726922fc-c94c-4f35-92c2-73ef9eb3bf3b	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-27	17:00:00	21:00:00	hoat_dong
476392e6-0d53-4329-8eb4-153750bd7a0c	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-28	17:00:00	21:00:00	hoat_dong
0aad37a7-a32f-46c6-b1a6-afc494dc91ee	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	2026-05-29	17:00:00	21:00:00	hoat_dong
35fb3de2-00f7-47de-9447-d1c851614929	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-25	08:00:00	12:00:00	hoat_dong
42dcf296-362e-48b6-b5a4-e200e4b9d75c	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-27	08:00:00	12:00:00	hoat_dong
ba42da6d-84f8-4d84-963c-809f74367a57	c87643c4-4823-48e2-a8fd-6bd804c8db5a	2026-05-29	08:00:00	12:00:00	hoat_dong
ebbd4caf-98b3-4b76-9fd5-1d0f04136740	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-25	08:00:00	12:00:00	hoat_dong
29a371b3-e9c0-4be2-9c9b-43a1a08362ea	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-26	08:00:00	12:00:00	hoat_dong
677932fb-cbac-45ec-adb6-e3428442e85b	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-27	08:00:00	12:00:00	hoat_dong
a10fc230-984b-4afc-9724-4e4f3a7ddca0	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-28	08:00:00	12:00:00	hoat_dong
fd07b0ce-2f8a-4fb0-bdad-ee1b7daf6046	7ff1127c-433b-41ca-9f47-7298cdf0ea96	2026-05-29	08:00:00	12:00:00	hoat_dong
\.


--
-- Data for Name: nguoi_dung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nguoi_dung (id, ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email, avatar_url, thoi_gian_tao, lan_dang_nhap_cuoi, deleted_at) FROM stdin;
d9b938c3-529a-4025-a04f-13d842839b52	Lễ tân 1	letan@officecare.com	0901234568	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	2	hoat_dong	t	\N	2026-05-24 07:53:39.125769	\N	\N
c6a140d1-19ed-4c2a-83e0-8bcf4a2e9522	BS Trần Văn Khám	bacsi@officecare.com	0901234569	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	4	hoat_dong	t	\N	2026-05-24 07:53:39.127701	\N	\N
c87643c4-4823-48e2-a8fd-6bd804c8db5a	KTV Trúc Ly Đặng	ktv2@officecare.com	0220 0065 1101	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	3	hoat_dong	t	\N	2026-05-24 07:53:39.139887	\N	\N
7ff1127c-433b-41ca-9f47-7298cdf0ea96	KTV Bảo Lan Tăng	ktv3@officecare.com	0280 6196 2997	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	3	hoat_dong	t	\N	2026-05-24 07:53:39.143738	\N	\N
8efcc325-bb38-4522-9b76-5b8ccf4eda37	KTV Anh Quân Lý	ktv4@officecare.com	0292 2262 4300	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	3	hoat_dong	t	\N	2026-05-24 07:53:39.147975	\N	\N
2712e855-9e22-4d5c-9036-f457d8e1d100	KTV Nguyệt Quế Lâm	ktv5@officecare.com	0251 0252 8395	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	3	hoat_dong	t	\N	2026-05-24 07:53:39.150905	\N	\N
762e79c0-3bde-4b59-bbb4-cb8744c91b94	Thụy Miên Vũ	HuuChien.Trinh@hotmail.com	0244 1622 6163	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.164581	\N	\N
f08b746b-06da-4edc-93c0-ac3fbb632e6c	Hoàng Minh Vương	HuuChien.7koan@hotmail.com	0232 2379 3641	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.168612	\N	\N
636423b1-c14d-4ea4-8558-8f8f8b54420e	Thái Tâm Đinh	QuynhTrang_Tran54@hotmail.com	0291 3572 5709	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.172537	\N	\N
694f7c3b-a9be-4567-99e8-deb4038a798b	Khánh Quyên Lê	DieuHien6@hotmail.com	027 5943 9915	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.177556	\N	\N
0490eade-0963-4fa8-ad01-9c8f92793c16	Hảo Nhi Bùi	MinhSon_To37@hotmail.com	022 8795 2697	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.182026	\N	\N
b70160d6-8d8d-4519-ac57-2cdb82031460	Quang Hòa Hồ	KhacDung20@hotmail.com	026 4124 5342	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.185222	\N	\N
16e1d38f-08bd-48b8-b4ea-1e210437f377	Hoài Phương Bùi	XuanLan.Pham55@yahoo.com	0260 5040 8037	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.188988	\N	\N
5b24f1fd-29fc-4f0a-b262-42a0e6b3346f	Quốc Trường Phan	ThuyVan14@yahoo.com	0223 3001 2459	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.192128	\N	\N
f52c830e-ee0d-41f9-893a-907cb316d019	Quang Tuấn Đoàn	BichVan68@hotmail.com	0258 7298 7261	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.196992	\N	\N
9c7c4824-a74b-4945-811f-07e6785993bf	Hải Dương Hồ	DuyMy.Bui@yahoo.com	029 5481 2310	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.200662	\N	\N
3c249cb2-8837-4990-b4b8-ac275ede3ff2	Thanh Lâm Trịnh	7kacThai29@yahoo.com	0218 4061 3331	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.205547	\N	\N
7e771d27-063a-4991-90e0-3ead6a345524	Phương Hoa Phùng	MyLoan_Pham@yahoo.com	025 3038 5613	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.209852	\N	\N
6aa5c0b8-5bdd-4e21-829d-83e901b97f95	Khởi Phong Tô	MinhThuan.7ko21@hotmail.com	0272 5227 6855	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.213771	\N	\N
fc413e3e-6f0f-4c17-ac46-8a5c257414d3	Anh Tùng Phùng	7kucTuong_Vuong8@yahoo.com	024 0807 5012	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.21846	\N	\N
a0d020ae-af0c-4fd7-90a7-81d40d79c7d3	Mai Khanh Ngô	HuyenLinh_Bui@hotmail.com	0243 1168 2508	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.222674	\N	\N
35b5f8fc-ea59-4b49-bc2e-718f0e72d41f	Chi Mai Vũ	NhuQuynh.Trinh@gmail.com	0294 1222 0894	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.226638	\N	\N
9792fb53-5155-4a7a-8333-fb53b6894b2f	Phương Liên Phan	LamGiang.Ho40@gmail.com	020 3684 7520	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.230945	\N	\N
320ba88b-2f0c-40af-93dc-bcd09b3b3f5d	Thu Oanh Mai	PhuongTien_Trinh@yahoo.com	024 2274 7999	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.234245	\N	\N
08245f5f-3203-4253-80ad-dcbf26caaea9	Bảo Pháp Trịnh	ThuyNgoc_Duong@gmail.com	0232 3015 5426	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.238198	\N	\N
fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	KTV Việt Hùng Phan	ktv1@officecare.com	0246 6108 2334	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	3	hoat_dong	t	\N	2026-05-24 07:53:39.135614	2026-05-24 08:39:19.4962	\N
43a6f84d-04b1-4163-bb0e-ad6e9461d891	vinh	vinhtcpd09969@gmail.com	\N	$2b$10$iH1bqKD0uOGDpSXJSu.SMO5ID53RBh8g8jWvu7z6vvUzSUXz258b2	1	hoat_dong	f	\N	2026-05-26 11:12:26.222	\N	\N
15721d01-1496-44d9-b438-ec932a6f9901	Tuấn Khải Phan	VanNgoc67@yahoo.com	0248 1408 1678	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	1	hoat_dong	t	\N	2026-05-24 07:53:39.15646	2026-05-26 12:02:49.606	\N
181ae686-2e8a-477e-8980-4ff7bd941d90	Admin Master	admin@officecare.com	0901234567	$2b$10$axUkqQG8CR0egnUbhIZ/HuKcgrpHFnJ.0T5nIhDzMqsxA98N85OCq	5	hoat_dong	t	\N	2026-05-24 07:53:39.113893	2026-05-26 12:17:31.397	\N
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, email, otp, expires_at, created_at) FROM stdin;
ca05e443-d2e5-4c77-8a1b-1e905035c28a	vinhtcpd09969@gmail.com	748722	2026-05-26 11:22:26.228+07	2026-05-26 11:12:26.229+07
\.


--
-- Data for Name: phong; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phong (id, ten_phong, ma_phong, loai_phong, loai_dich_vu_ho_tro, thiet_bi, mo_ta, trang_thai, tang) FROM stdin;
37	Phòng 101 - Khám VIP 1	P101	kham_benh	\N	\N	\N	san_sang	Tang 1
38	Phòng 102 - Khám tổng quát	P102	kham_benh	\N	\N	\N	san_sang	Tang 1
39	Phòng 201 - Trị liệu Vật lý	P201	tri_lieu	\N	\N	\N	san_sang	Tang 2
40	Phòng 202 - Điện xung trị liệu	P202	tri_lieu	\N	\N	\N	san_sang	Tang 2
41	Phòng 203 - Kéo giãn cột sống	P203	tri_lieu	\N	\N	\N	san_sang	Tang 2
42	Phòng 301 - Phục hồi chức năng	P301	phuc_hoi	\N	\N	\N	san_sang	Tang 3
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, nguoi_dung_id, token, expires_at, created_at) FROM stdin;
54	181ae686-2e8a-477e-8980-4ff7bd941d90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4MWFlNjg2LTJlOGEtNDc3ZS04OTgwLTRmZjdiZDk0MWQ5MCIsImlhdCI6MTc3OTU4NDA1MiwiZXhwIjoxNzgwMTg4ODUyfQ.3Efjvf5K7dwAKUXBsiJvh7mXDs9cJ2QmY09_uiDKKjI	2026-05-31 07:54:12.414	2026-05-24 07:54:12.421182
55	fc7e076e-7b16-45cb-b843-b19d2d4c4ceb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZjN2UwNzZlLTdiMTYtNDVjYi1iODQzLWIxOWQyZDRjNGNlYiIsImlhdCI6MTc3OTU4Njc1OSwiZXhwIjoxNzgwMTkxNTU5fQ.VcXerl465Qv90Dr_xQtq0Q0L1Iq4asXy2J6DR1v1Nvg	2026-05-31 08:39:19.482	2026-05-24 08:39:19.4869
56	181ae686-2e8a-477e-8980-4ff7bd941d90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4MWFlNjg2LTJlOGEtNDc3ZS04OTgwLTRmZjdiZDk0MWQ5MCIsImlhdCI6MTc3OTU4Njg2MywiZXhwIjoxNzgwMTkxNjYzfQ.pysZ-q37wftJ5giDQl-VOi1ELt5VhBo-O7cjmYarT8c	2026-05-31 08:41:03.718	2026-05-24 08:41:03.720433
57	181ae686-2e8a-477e-8980-4ff7bd941d90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4MWFlNjg2LTJlOGEtNDc3ZS04OTgwLTRmZjdiZDk0MWQ5MCIsImlhdCI6MTc3OTU4NzAzNSwiZXhwIjoxNzgwMTkxODM1fQ.OALx4XCGl11tFpVOr1kXYkcQqTO-loj50vNowewUPSk	2026-05-31 08:43:55.826	2026-05-24 08:43:55.832495
58	181ae686-2e8a-477e-8980-4ff7bd941d90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4MWFlNjg2LTJlOGEtNDc3ZS04OTgwLTRmZjdiZDk0MWQ5MCIsImlhdCI6MTc3OTU4NzE3MywiZXhwIjoxNzgwMTkxOTczfQ.ZEURIYhvt6YmQAV9plmyKmcpjKShHzxz0CjZoHdzQMY	2026-05-31 08:46:13.351	2026-05-24 08:46:13.355931
59	181ae686-2e8a-477e-8980-4ff7bd941d90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4MWFlNjg2LTJlOGEtNDc3ZS04OTgwLTRmZjdiZDk0MWQ5MCIsImlhdCI6MTc3OTcwODk0NCwiZXhwIjoxNzgwMzEzNzQ0fQ.4hZgMZ7cGpEWzkZA4PfTK9EW155cdZsVAGTfHYuwT1A	2026-06-01 11:35:44.996	2026-05-25 11:35:45.046
60	15721d01-1496-44d9-b438-ec932a6f9901	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE1NzIxZDAxLTE0OTYtNDRkOS1iNDM4LWVjOTMyYTZmOTkwMSIsImlhdCI6MTc3OTc5NDI4NCwiZXhwIjoxNzgwMzk5MDg0fQ.VIBjOjoxK5HfoJihlLPoufmx_sib0JDJBs2Sz4nI0r4	2026-06-02 11:18:04.051	2026-05-26 11:18:04.061
61	15721d01-1496-44d9-b438-ec932a6f9901	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE1NzIxZDAxLTE0OTYtNDRkOS1iNDM4LWVjOTMyYTZmOTkwMSIsImlhdCI6MTc3OTc5Njk2OSwiZXhwIjoxNzgwNDAxNzY5fQ.MV5Bn7mzHpNmnOv2oyTUm0wQyThDwtyE0WmBVNkgWbM	2026-06-02 12:02:49.57	2026-05-26 12:02:49.579
62	181ae686-2e8a-477e-8980-4ff7bd941d90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4MWFlNjg2LTJlOGEtNDc3ZS04OTgwLTRmZjdiZDk0MWQ5MCIsImlhdCI6MTc3OTc5NzE3MCwiZXhwIjoxNzgwNDAxOTcwfQ.tfIt-A9XLdj9RRZfcHSzZJa_ugQ_QkYpN_U44qKEByc	2026-06-02 12:06:10.535	2026-05-26 12:06:10.535
63	181ae686-2e8a-477e-8980-4ff7bd941d90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4MWFlNjg2LTJlOGEtNDc3ZS04OTgwLTRmZjdiZDk0MWQ5MCIsImlhdCI6MTc3OTc5Nzg1MSwiZXhwIjoxNzgwNDAyNjUxfQ.GfE6SocD2GOJ2ddHf85q8lXYT4QPeZC8VI5plkLWF1w	2026-06-02 12:17:31.39	2026-05-26 12:17:31.39
\.


--
-- Data for Name: thanh_toan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thanh_toan (id, ma_giao_dich, hoa_don_id, so_tien, phuong_thuc, trang_thai, ma_tham_chieu, nguoi_thu_tien_id, thoi_gian_giao_dich, ghi_chu) FROM stdin;
d79e1567-b1d7-42ef-871d-53fa8687e853	GD40578460	3f4cd012-6a9b-440a-aeb9-3b0169713426	80000	chuyen_khoan	thanh_cong	\N	\N	2026-05-20 04:18:47.629	\N
068941a4-4d5a-4f0e-a003-cfab898ccde7	GD97553114	bd079107-44e7-44fc-a55f-f7183f056b7d	900000	chuyen_khoan	thanh_cong	\N	\N	2026-03-23 11:06:55.255	\N
49e8b1d0-b63a-487e-b5e2-b91d37e1dfc6	GD12045351	ce4a0914-5192-44fe-95d1-cb5b9de2ae47	80000	chuyen_khoan	thanh_cong	\N	\N	2026-02-09 19:00:33.785	\N
a1f168ec-9e71-4d07-8b79-e97d1dbf870a	GD21000261	09878aff-a78c-438d-bd5c-93fca21e0832	450000	chuyen_khoan	thanh_cong	\N	\N	2025-12-02 10:01:52.226	\N
5b456c79-0f4b-407f-b707-f9f1081d8ed7	GD13405444	162b989c-f085-45bd-b3ea-0a7b9e7f64d6	800000	chuyen_khoan	thanh_cong	\N	\N	2025-12-17 07:29:10.271	\N
6aadf36b-7ba5-4ebf-9149-9a1af656051d	GD00097667	8e68789d-2bce-46ee-a4f3-e24269b93b80	230000	chuyen_khoan	thanh_cong	\N	\N	2026-03-19 13:40:59.191	\N
5c54da06-5c06-45f3-88f0-6a25b25d9d59	GD22264543	03629108-7b91-410c-aa6b-b604bcd7aa51	120000	chuyen_khoan	thanh_cong	\N	\N	2025-12-10 19:44:58.659	\N
295a1bbf-6170-4cf6-858d-6a17c894d6eb	GD68189948	7de5ddf7-40aa-4561-8604-51322a403550	230000	chuyen_khoan	thanh_cong	\N	\N	2026-03-31 20:55:19.431	\N
4cf902c3-e951-4833-ae17-440e0addb885	GD54481048	8cae457a-2063-4bd7-80af-55fcd465cd8c	120000	chuyen_khoan	thanh_cong	\N	\N	2026-05-06 00:29:15.01	\N
14f94148-32df-4c4b-9a6e-f35d52c8ae02	GD68579554	aef217ad-98fa-4ce3-9a9f-df1e1c6f3a58	150000	chuyen_khoan	thanh_cong	\N	\N	2025-12-02 09:09:25.632	\N
6813bb5f-fa87-4240-9575-82552bd69b6e	GD08383116	d1c597a8-8a11-4ffc-8f91-130ce8e71796	120000	chuyen_khoan	thanh_cong	\N	\N	2026-03-14 07:11:09.185	\N
9a771695-e3c8-4965-ae26-ef16601bda64	GD49500091	1d015035-5b00-4d70-b3c8-f0e19a144852	120000	chuyen_khoan	thanh_cong	\N	\N	2026-03-03 02:33:31.675	\N
3d26fd2a-64cf-42f8-b85c-5a621351e1c7	GD03394151	7349c3c7-6204-4b62-95ef-dd2263973e1b	100000	chuyen_khoan	thanh_cong	\N	\N	2026-03-15 18:39:34.182	\N
50a26e97-5e0e-42a0-993e-79927f3813df	GD58454185	4e39687a-5cbe-43ea-bf7b-a8e7a3285c41	450000	chuyen_khoan	thanh_cong	\N	\N	2026-03-10 21:43:18.861	\N
b29026f5-7a70-4595-bc6e-092178b8d5da	GD19412412	eb8452f4-365f-4909-a810-d9264cfc7840	250000	chuyen_khoan	thanh_cong	\N	\N	2026-02-17 15:16:37.742	\N
cf3ce1cc-73f2-4323-8d1a-6dd9e3b01db5	GD60442508	dd82d817-41ba-413f-a33e-1009570e5bb2	250000	chuyen_khoan	thanh_cong	\N	\N	2025-11-26 16:50:38.552	\N
b9ceafb1-f1b9-448f-95bd-0655968871a8	GD61362077	efed2180-6f22-4c3f-8ee8-c6ceacb0845e	120000	chuyen_khoan	thanh_cong	\N	\N	2026-02-08 08:22:29.891	\N
a42140c1-d570-4936-ac72-01af9517ad59	GD43091419	82e9458a-e026-40e3-9739-b2309e706f54	100000	chuyen_khoan	thanh_cong	\N	\N	2026-04-16 06:13:45.265	\N
55058369-2b29-41ed-bfb9-d601c2636731	GD40656401	6e2b04ad-c59e-41a4-aa05-105f4ae0ed7d	80000	chuyen_khoan	thanh_cong	\N	\N	2026-01-09 14:00:37.426	\N
ed171718-1f72-4428-a314-2ba13f2dbcc0	GD09167992	656ea046-3e6a-450d-b2c7-506926d95496	250000	chuyen_khoan	thanh_cong	\N	\N	2026-05-01 09:36:45.533	\N
3201d8f1-3f00-499b-ada0-2d3693d86fe3	GD17183879	55b21839-6c4e-42a9-9eef-6355552282c3	650000	chuyen_khoan	thanh_cong	\N	\N	2025-12-20 14:52:16.254	\N
52c6a3e3-0238-4907-96c4-214c4cb5aa07	GD68743253	7db8b83b-6047-4d3e-90f0-4ce4ac5af27a	200000	chuyen_khoan	thanh_cong	\N	\N	2026-04-08 05:58:13.561	\N
f3845388-d972-4cf8-a730-813ee0f1f744	GD44932644	57ce186c-9dc9-45fe-b6d0-69902f62df1e	180000	chuyen_khoan	thanh_cong	\N	\N	2025-12-29 01:00:24.655	\N
2fc81d43-379c-493b-9db5-788e2a228963	GD38130342	cd9854f2-ce1d-469a-8094-4a4e53dd3e6f	180000	chuyen_khoan	thanh_cong	\N	\N	2026-01-08 14:48:23.144	\N
af1cb03e-a48e-4360-9513-a81ee615e9dc	GD35544321	3bae13c9-7969-4ea1-be80-7ea0c7dfe0d1	650000	chuyen_khoan	thanh_cong	\N	\N	2025-12-13 18:48:23.695	\N
9bbc514d-85ab-4c18-8be6-437b5aed2fba	GD33645660	60a9ff84-7b69-456f-9c32-498749cad57e	230000	chuyen_khoan	thanh_cong	\N	\N	2025-11-29 05:58:43.661	\N
8efb1d45-7ad0-439b-aa32-3020346c1be9	GD67905901	f6d935db-55f5-4a11-99ce-f961ff06db8d	150000	chuyen_khoan	thanh_cong	\N	\N	2026-04-13 03:04:27.897	\N
80a190e4-5a03-4c18-aad9-ce11bfb13ab8	GD90572938	24167dd2-0f9e-4ca7-bafd-8044e6e9abae	80000	chuyen_khoan	thanh_cong	\N	\N	2026-03-01 06:41:17.726	\N
efd01b60-e383-4bf7-8217-4b091573e7f2	GD17907340	e394780d-79d7-485b-8c22-1c08d69bfe46	350000	chuyen_khoan	thanh_cong	\N	\N	2025-12-08 10:54:32.817	\N
3769292c-586e-4a3f-adb9-7f9208827e05	GD83490427	42d2635f-fba1-4cf3-bb75-fc18b6c85b10	450000	chuyen_khoan	thanh_cong	\N	\N	2026-04-29 17:45:26.999	\N
1adb12f1-0dac-4ee3-881d-bbeb3bc3d7b9	GD91789093	434e31fd-8982-4d59-a7b1-2ca02d7fc955	80000	chuyen_khoan	thanh_cong	\N	\N	2026-02-25 02:07:49.954	\N
ba7857d2-d541-4bdf-99b8-914da8310af0	GD20714850	041a8858-3a16-44fe-b530-df1e328c1cf5	350000	chuyen_khoan	thanh_cong	\N	\N	2025-12-07 10:32:39.298	\N
e4b99a16-11e2-4fe5-9980-55cbcfe62b7c	GD62150865	8f937abd-1eeb-44a4-8576-d35ddd0dedfc	150000	chuyen_khoan	thanh_cong	\N	\N	2025-12-26 10:13:39.401	\N
084df321-62be-4995-a0f0-5fc8ad1f1c9f	GD14926479	2dfd8ed4-4dec-4577-9448-3b9e69fe31a9	1100000	chuyen_khoan	thanh_cong	\N	\N	2026-01-11 12:25:26.647	\N
93525e15-25d8-4e08-b46d-a2e364427da8	GD63514442	82b76da5-948a-4be4-a479-78d718ed85ae	120000	chuyen_khoan	thanh_cong	\N	\N	2026-03-16 01:27:24.676	\N
841ca6d3-e0cd-493e-95a6-3e1e7bdbd638	GD23942144	89a8799f-0dc8-42bc-9b20-fba632b11017	300000	chuyen_khoan	thanh_cong	\N	\N	2025-12-09 21:49:41.402	\N
849ed474-5c1a-4de0-ac2e-67e0ad4047ba	GD15596666	a455fc7b-8952-4051-9869-b91e1ace7da5	900000	chuyen_khoan	thanh_cong	\N	\N	2026-02-04 07:16:59.799	\N
f1b18baf-7ccb-46b3-bc54-c4e611e86d95	GD01879469	b470c3f6-0548-47d8-ae76-a631592ad9fd	350000	chuyen_khoan	thanh_cong	\N	\N	2026-02-27 03:11:20.364	\N
901db48b-b2fb-445c-8138-c99cb5dfc0d6	GD61355656	f2636b76-dc74-4c1f-9df7-c4ecfa358e64	150000	chuyen_khoan	thanh_cong	\N	\N	2026-01-19 07:38:38.763	\N
890592ba-ccc5-4ce9-8017-10894c9bc086	GD16910585	9fa820fc-cf54-4bde-b5d5-d2ec0c485ea7	180000	chuyen_khoan	thanh_cong	\N	\N	2026-05-11 16:48:36.112	\N
dbe12582-d2f7-4b07-9bfd-dc55ef6ea9ce	GD67550527	45b0c333-7c7a-47db-b9b8-503266d1d040	220000	chuyen_khoan	thanh_cong	\N	\N	2026-04-04 06:24:27.071	\N
6a843778-4969-4168-807f-2e2925a53a8d	GD23370000	219a9be7-2953-4c92-bd25-11408f82fb2c	130000	chuyen_khoan	thanh_cong	\N	\N	2026-01-23 08:21:56.753	\N
17992244-4259-4f68-ba37-28007719d616	GD76488840	b6be0a55-c220-4104-816f-46ec238c55c9	100000	chuyen_khoan	thanh_cong	\N	\N	2025-11-27 16:40:38.108	\N
5355a59a-7faa-4cd9-ab51-69d748b59ba5	GD97041026	08ffb568-62a5-4ec2-af2a-900df1cf5a20	100000	chuyen_khoan	thanh_cong	\N	\N	2025-12-07 21:54:42.959	\N
10e076b4-e44e-4d90-8ba1-050c56bf604e	GD33452649	7a0ac2e4-87c8-4389-8c52-d9d82a6f31d4	400000	chuyen_khoan	thanh_cong	\N	\N	2026-04-14 11:45:39.705	\N
c0521414-f659-446b-8dd0-1fefdfcbc5ff	GD46238108	3fe2cb56-f05b-49e3-9e2c-0e6c91e878c0	180000	chuyen_khoan	thanh_cong	\N	\N	2026-04-23 22:50:12.462	\N
5397a88b-01ca-47a0-a63a-5320295ec950	GD38773289	23da7b85-4eec-48d0-bcdf-0968799d8f94	180000	chuyen_khoan	thanh_cong	\N	\N	2025-12-10 10:12:19.768	\N
eeb34bde-5faa-48ef-a11d-f6ec987aa9af	GD12601066	2a0b6903-c67e-41a9-a9b6-3c9d39f3450d	120000	chuyen_khoan	thanh_cong	\N	\N	2026-03-08 22:43:48.353	\N
54405f2d-6c0b-44ab-a080-b365db9fbf69	GD10911102	edb555f5-bc56-42f5-bfd5-3b3c1ce2b0dd	230000	chuyen_khoan	thanh_cong	\N	\N	2026-05-11 21:44:08.923	\N
b48c21f6-e3d4-4310-be91-eb2ffbcba736	GD05576457	ebd136c3-47ed-4342-8369-82605fd89a36	100000	chuyen_khoan	thanh_cong	\N	\N	2026-04-28 05:49:34.147	\N
f2f0f424-305f-483a-a5c3-c5400c08fac2	GD99471741	9989e773-a17e-4814-b532-bfc1781771c3	200000	tien_mat	thanh_cong	\N	\N	2026-05-26 22:32:43.938083	Khách không hài lòng gói: Khách có việc
\.


--
-- Data for Name: thiet_bi_y_te; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thiet_bi_y_te (id, ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, ngay_bao_tri_tiep_theo, trang_thai, phong_id_hien_tai, ghi_chu, thoi_gian_tao) FROM stdin;
\.


--
-- Data for Name: thong_bao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thong_bao (id, nguoi_dung_id, tieu_de, noi_dung, loai, da_doc, thoi_gian_tao) FROM stdin;
\.


--
-- Data for Name: vai_tro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vai_tro (id, ma_vai_tro, ten_hien_thi, mo_ta_quyen) FROM stdin;
1	khach_hang	Khách hàng	Xem lịch của mình, đặt lịch, xem gói, gửi feedback
2	le_tan	Lễ tân	Quản lý lịch hẹn, check-in, tạo hóa đơn, thu tiền
3	ky_thuat_vien	Kỹ thuật viên	Xem lịch của mình, tạo đánh giá, ghi chú buổi, đề xuất gói
4	bac_si	Bác sĩ	Quản lý phác đồ điều trị, chẩn đoán, xem hồ sơ bệnh án
5	admin	Quản trị viên	Toàn quyền hệ thống
\.


--
-- Data for Name: voucher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voucher (id, ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, ap_dung_cho, so_luong_toi_da, so_luong_da_dung, ngay_bat_dau, ngay_het_han, tao_boi, trang_thai, thoi_gian_tao, tu_dong_ap_dung, yeu_cau_thanh_toan) FROM stdin;
42572969-8a08-4f5a-8701-0995aa0206a3	AUTO_PRM_194650	Giảm 10% Full Bill	phan_tram	10	\N	0	goi_cu_the	20	0	2026-04-17	2026-06-17	181ae686-2e8a-477e-8980-4ff7bd941d90	hoat_dong	2026-05-24 07:53:39.708714	t	tra_thang
3fbf42ba-274b-4e81-8db2-9d0a604478d6	AUTO_PRM_814405	Giảm 5% trả góp	phan_tram	5	\N	0	goi_cu_the	\N	0	2026-05-17	2026-05-28	181ae686-2e8a-477e-8980-4ff7bd941d90	hoat_dong	2026-05-25 22:08:07.778691	t	tra_gop
\.


--
-- Data for Name: voucher_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voucher_dich_vu (id, voucher_id, dich_vu_id) FROM stdin;
\.


--
-- Data for Name: voucher_goi_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voucher_goi_dich_vu (id, voucher_id, goi_dich_vu_id) FROM stdin;
6feb9921-2ca3-409a-ae25-c4f24079aa4c	42572969-8a08-4f5a-8701-0995aa0206a3	608ef1b3-9a91-4d3b-8607-a36f1f0c3380
567c36c9-beea-4b18-a55f-cd10db436f99	42572969-8a08-4f5a-8701-0995aa0206a3	ffec32a7-bd0d-4239-b4f3-05941be0468f
92d9c45e-6742-4765-a966-1c4324e43f23	42572969-8a08-4f5a-8701-0995aa0206a3	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5
4ddf46b2-c4a8-4a77-9bbd-4afd8ac92028	3fbf42ba-274b-4e81-8db2-9d0a604478d6	ffec32a7-bd0d-4239-b4f3-05941be0468f
1a072d48-d9f9-48ec-a6c2-5b7d23278033	3fbf42ba-274b-4e81-8db2-9d0a604478d6	51c9d1ce-a2bf-4bee-9626-91f3d8ef26c5
\.


--
-- Name: buoi_dich_vu_su_dung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buoi_dich_vu_su_dung_id_seq', 1, false);


--
-- Name: danh_muc_dich_vu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.danh_muc_dich_vu_id_seq', 24, true);


--
-- Name: goi_dich_vu_chi_tiet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goi_dich_vu_chi_tiet_id_seq', 190, true);


--
-- Name: phong_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phong_id_seq', 42, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 63, true);


--
-- Name: vai_tro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vai_tro_id_seq', 5, true);


--
-- Name: buoi_dich_vu_su_dung buoi_dich_vu_su_dung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_dich_vu_su_dung
    ADD CONSTRAINT buoi_dich_vu_su_dung_pkey PRIMARY KEY (id);


--
-- Name: buoi_tri_lieu_dich_vu buoi_tri_lieu_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu_dich_vu
    ADD CONSTRAINT buoi_tri_lieu_dich_vu_pkey PRIMARY KEY (id);


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
-- Name: thong_bao thong_bao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_pkey PRIMARY KEY (id);


--
-- Name: voucher_dich_vu unique_voucher_dich_vu; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_dich_vu
    ADD CONSTRAINT unique_voucher_dich_vu UNIQUE (voucher_id, dich_vu_id);


--
-- Name: voucher_goi_dich_vu unique_voucher_goi_dich_vu; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_goi_dich_vu
    ADD CONSTRAINT unique_voucher_goi_dich_vu UNIQUE (voucher_id, goi_dich_vu_id);


--
-- Name: vai_tro vai_tro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro
    ADD CONSTRAINT vai_tro_pkey PRIMARY KEY (id);


--
-- Name: voucher_dich_vu voucher_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_dich_vu
    ADD CONSTRAINT voucher_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: voucher_goi_dich_vu voucher_goi_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_goi_dich_vu
    ADD CONSTRAINT voucher_goi_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: voucher voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_pkey PRIMARY KEY (id);


--
-- Name: idx_bdvsu_buoi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bdvsu_buoi ON public.buoi_dich_vu_su_dung USING btree (buoi_tri_lieu_id);


--
-- Name: idx_bdvsu_dv; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bdvsu_dv ON public.buoi_dich_vu_su_dung USING btree (dich_vu_id);


--
-- Name: idx_thong_bao_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_thong_bao_user ON public.thong_bao USING btree (nguoi_dung_id);


--
-- Name: buoi_dich_vu_su_dung buoi_dich_vu_su_dung_buoi_tri_lieu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_dich_vu_su_dung
    ADD CONSTRAINT buoi_dich_vu_su_dung_buoi_tri_lieu_id_fkey FOREIGN KEY (buoi_tri_lieu_id) REFERENCES public.buoi_tri_lieu(id) ON DELETE CASCADE;


--
-- Name: buoi_dich_vu_su_dung buoi_dich_vu_su_dung_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_dich_vu_su_dung
    ADD CONSTRAINT buoi_dich_vu_su_dung_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: buoi_dich_vu_su_dung buoi_dich_vu_su_dung_duyet_boi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_dich_vu_su_dung
    ADD CONSTRAINT buoi_dich_vu_su_dung_duyet_boi_fkey FOREIGN KEY (duyet_boi) REFERENCES public.nguoi_dung(id);


--
-- Name: buoi_dich_vu_su_dung buoi_dich_vu_su_dung_ktv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_dich_vu_su_dung
    ADD CONSTRAINT buoi_dich_vu_su_dung_ktv_id_fkey FOREIGN KEY (ktv_id) REFERENCES public.nguoi_dung(id);


--
-- Name: buoi_tri_lieu_dich_vu buoi_tri_lieu_dich_vu_buoi_tri_lieu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu_dich_vu
    ADD CONSTRAINT buoi_tri_lieu_dich_vu_buoi_tri_lieu_id_fkey FOREIGN KEY (buoi_tri_lieu_id) REFERENCES public.buoi_tri_lieu(id) ON DELETE CASCADE;


--
-- Name: buoi_tri_lieu_dich_vu buoi_tri_lieu_dich_vu_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu_dich_vu
    ADD CONSTRAINT buoi_tri_lieu_dich_vu_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id) ON DELETE CASCADE;


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
-- Name: hoa_don hoa_don_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: hoa_don hoa_don_lich_dieu_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_lich_dieu_tri_id_fkey FOREIGN KEY (lich_dieu_tri_id) REFERENCES public.lich_dieu_tri(id) ON DELETE SET NULL;


--
-- Name: hoa_don hoa_don_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.voucher(id) ON DELETE SET NULL;


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
-- Name: refresh_tokens refresh_tokens_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: thanh_toan thanh_toan_hoa_don_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanh_toan
    ADD CONSTRAINT thanh_toan_hoa_don_id_fkey FOREIGN KEY (hoa_don_id) REFERENCES public.hoa_don(id);


--
-- Name: thong_bao thong_bao_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id) ON DELETE CASCADE;


--
-- Name: voucher_dich_vu voucher_dich_vu_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_dich_vu
    ADD CONSTRAINT voucher_dich_vu_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id) ON DELETE CASCADE;


--
-- Name: voucher_dich_vu voucher_dich_vu_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_dich_vu
    ADD CONSTRAINT voucher_dich_vu_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.voucher(id) ON DELETE CASCADE;


--
-- Name: voucher_goi_dich_vu voucher_goi_dich_vu_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_goi_dich_vu
    ADD CONSTRAINT voucher_goi_dich_vu_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id) ON DELETE CASCADE;


--
-- Name: voucher_goi_dich_vu voucher_goi_dich_vu_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher_goi_dich_vu
    ADD CONSTRAINT voucher_goi_dich_vu_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.voucher(id) ON DELETE CASCADE;


--
-- Name: voucher voucher_tao_boi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_tao_boi_fkey FOREIGN KEY (tao_boi) REFERENCES public.nguoi_dung(id);


--
-- PostgreSQL database dump complete
--

\unrestrict sHmWoV0a7NYOYT1VPsbOb7cv7KyyUwSUuLv2eN2m9yyTgpBIckHT26azx1VKqm4

