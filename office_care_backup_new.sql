--
-- PostgreSQL database dump
--

\restrict ELGusdghGeXocWcblc2Rwq0pWVatbKAG5xSBf8OFsbwSvQ8wqgU0CsZGFEUqCja

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


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
    thoi_gian_bat_dau timestamp(6) with time zone NOT NULL,
    thoi_gian_ket_thuc timestamp(6) with time zone,
    danh_gia_truoc_buoi integer,
    danh_gia_sau_buoi integer,
    danh_gia_hieu_qua integer,
    so_thu_tu_buoi integer,
    trang_thai character varying(20) DEFAULT 'dang_thuc_hien'::character varying NOT NULL,
    canh_bao_dac_biet text,
    ai_tom_tat_ngan character varying(300),
    thoi_gian_ghi_chu timestamp(6) with time zone
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
    thoi_gian_thuc_hien timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    ktv_id uuid,
    loai_dich_vu_su_dung character varying(20) DEFAULT 'trong_goi'::character varying,
    trang_thai character varying(20) DEFAULT 'da_duyet'::character varying,
    ghi_chu_ly_do text,
    duyet_boi uuid,
    duyet_luc timestamp(6) without time zone
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
    ngay_vao_lam date,
    luong_cung_ca bigint DEFAULT 150000,
    luong_kpi_ca bigint DEFAULT 50000
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
    thoi_gian_danh_gia timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    an_hien boolean DEFAULT true NOT NULL,
    loai_danh_muc character varying(20) DEFAULT 'dich_vu'::character varying
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
    thiet_bi_yeu_cau character varying(255),
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
    thoi_gian_tao timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    danh_muc_id bigint,
    loai_goi character varying(20) DEFAULT 'lieu_trinh'::character varying,
    so_dv_toi_da_moi_buoi integer DEFAULT 5,
    phan_tram_giam_tra_thang integer DEFAULT 10,
    phan_tram_giam_tra_gop integer DEFAULT 5
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
-- Name: ho_so_dieu_tri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ho_so_dieu_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lich_dat_id uuid NOT NULL,
    chuyen_gia_id uuid,
    chan_doan text,
    chong_chi_dinh text,
    goi_dich_vu_id uuid,
    dich_vu_id uuid,
    ghi_chu text,
    thoi_gian_tao timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ho_so_dieu_tri OWNER TO postgres;

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
    ngay_tao timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ngay_thanh_toan timestamp(6) without time zone,
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
    ho_ten character varying(150) NOT NULL,
    email character varying(255),
    so_dien_thoai character varying(20),
    mat_khau_hash character varying(255),
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    da_xac_thuc_email boolean DEFAULT false NOT NULL,
    avatar_url text,
    lan_dang_nhap_cuoi timestamp(6) without time zone,
    ngay_sinh date,
    gioi_tinh character varying(10),
    dia_chi text,
    thoi_gian_tao timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) without time zone
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
    bac_si_id uuid,
    phong_id bigint,
    ngay_gio_bat_dau timestamp(6) with time zone NOT NULL,
    ngay_gio_ket_thuc timestamp(6) with time zone NOT NULL,
    ly_do_kham text,
    anh_dinh_kem_url text,
    trang_thai character varying(30) DEFAULT 'cho_xac_nhan'::character varying NOT NULL,
    ghi_chu_dat_lich text,
    ghi_chu_noi_bo text,
    thoi_gian_checkin timestamp(6) with time zone,
    thoi_gian_huy timestamp(6) with time zone,
    ly_do_huy text,
    nguoi_tao character varying(20) DEFAULT 'khach_hang'::character varying NOT NULL,
    thoi_gian_tao timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    han_xac_nhan timestamp(6) with time zone
);


ALTER TABLE public.lich_dat OWNER TO postgres;

--
-- Name: lich_dieu_tri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_dieu_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khach_hang_id uuid NOT NULL,
    loai_dieu_tri character varying(20) NOT NULL,
    tong_so_buoi integer NOT NULL,
    so_buoi_da_dung integer DEFAULT 0 NOT NULL,
    trang_thai character varying(20) DEFAULT 'dang_dieu_tri'::character varying NOT NULL,
    thoi_gian_tao timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ma_lich_dieu_tri character varying(20),
    phong_id bigint,
    ghi_chu_noi_bo text,
    ngay_bat_dau timestamp(6) without time zone,
    ngay_ket_thuc timestamp(6) without time zone,
    ho_so_dieu_tri_id uuid
);


ALTER TABLE public.lich_dieu_tri OWNER TO postgres;

--
-- Name: lich_lam_viec; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_lam_viec (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    ngay date NOT NULL,
    gio_bat_dau time(6) without time zone NOT NULL,
    gio_ket_thuc time(6) without time zone NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying,
    thoi_gian_checkin timestamp(6) with time zone,
    thoi_gian_checkout timestamp(6) with time zone,
    trang_thai_cham_cong character varying(30),
    phong_id bigint,
    giuong_so integer
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
    thoi_gian_tao timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    lan_dang_nhap_cuoi timestamp(6) without time zone,
    deleted_at timestamp(6) without time zone
);


ALTER TABLE public.nguoi_dung OWNER TO postgres;

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    mo_ta text,
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    tang character varying(20),
    so_luong_giuong integer DEFAULT 1 NOT NULL
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
    nguoi_dung_id uuid,
    khach_hang_id uuid,
    token text NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
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
    thoi_gian_giao_dich timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    phong_id_hien_tai bigint,
    ghi_chu text,
    thoi_gian_tao timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    so_lan_su_dung integer DEFAULT 0,
    nguong_canh_bao integer DEFAULT 80,
    nguong_bat_buoc_bao_tri integer DEFAULT 100,
    tan_suat_bao_tri_ngay integer DEFAULT 45,
    ngay_bao_tri_gan_nhat date,
    cap_rui_ro character varying(20) DEFAULT 'trung_binh'::character varying
);


ALTER TABLE public.thiet_bi_y_te OWNER TO postgres;

--
-- Name: thong_bao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thong_bao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid,
    khach_hang_id uuid,
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
    so_luong_toi_da integer,
    so_luong_da_dung integer DEFAULT 0 NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_het_han date,
    tao_boi uuid NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    thoi_gian_tao timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    yeu_cau_thanh_toan character varying(30) DEFAULT 'tat_ca'::character varying NOT NULL
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
-- Data for Name: buoi_tri_lieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buoi_tri_lieu (id, lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, danh_gia_truoc_buoi, danh_gia_sau_buoi, danh_gia_hieu_qua, so_thu_tu_buoi, trang_thai, canh_bao_dac_biet, ai_tom_tat_ngan, thoi_gian_ghi_chu) FROM stdin;
\.


--
-- Data for Name: buoi_tri_lieu_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buoi_tri_lieu_dich_vu (id, buoi_tri_lieu_id, dich_vu_id, so_luong, thoi_gian_thuc_hien, ktv_id, loai_dich_vu_su_dung, trang_thai, ghi_chu_ly_do, duyet_boi, duyet_luc) FROM stdin;
\.


--
-- Data for Name: chuyen_gia_y_te; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chuyen_gia_y_te (id, nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem, chung_chi, mo_ta_ban_than, anh_dai_dien_url, trang_thai, ngay_vao_lam, luong_cung_ca, luong_kpi_ca) FROM stdin;
20000000-0000-0000-0000-000000000005	00000000-0000-0000-0000-000000000005	BS-001	Vật lý trị liệu & Phục hồi chức năng	8	Chứng chỉ VLTL - Bộ Y Tế	Chuyên gia điều trị đau cơ xương khớp, phục hồi sau chấn thương thể thao.	\N	hoat_dong	2020-01-15	300000	100000
20000000-0000-0000-0000-000000000006	00000000-0000-0000-0000-000000000006	BS-002	Y học cổ truyền & Phục hồi chức năng	6	Chứng chỉ YHCT - Bộ Y Tế	Chuyên trị liệu cột sống, chỉnh tư thế và điều trị bệnh lý nghề nghiệp.	\N	hoat_dong	2021-03-01	300000	100000
20000000-0000-0000-0000-000000000007	00000000-0000-0000-0000-000000000007	KTV-001	Massage trị liệu & Giải phóng cơ	5	Chứng chỉ KTV VLTL	Có kinh nghiệm massage trị liệu cổ vai gáy, lưng và các bệnh nghề nghiệp.	\N	hoat_dong	2021-06-01	150000	50000
20000000-0000-0000-0000-000000000008	00000000-0000-0000-0000-000000000008	KTV-002	Kéo giãn & Điện trị liệu	4	Chứng chỉ KTV VLTL	Chuyên sử dụng các thiết bị kéo giãn, điện xung và nhiệt trị liệu.	\N	hoat_dong	2022-01-10	150000	50000
20000000-0000-0000-0000-000000000009	00000000-0000-0000-0000-000000000009	KTV-003	Chỉnh tư thế & Vận động trị liệu	3	Chứng chỉ KTV VLTL	Có kinh nghiệm chỉnh tư thế, hướng dẫn bài tập phục hồi.	\N	hoat_dong	2022-08-15	150000	50000
20000000-0000-0000-0000-000000000010	00000000-0000-0000-0000-000000000010	KTV-004	Massage & Liệu pháp tinh dầu	3	Chứng chỉ KTV Massage	Chuyên các liệu pháp thư giãn, massage tinh dầu và giảm stress.	\N	hoat_dong	2023-02-01	150000	50000
\.


--
-- Data for Name: danh_gia_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_gia_dich_vu (id, buoi_tri_lieu_id, khach_hang_id, ky_thuat_vien_id, so_sao_tong, so_sao_ktv, nhan_xet, hieu_qua_dieu_tri, se_quay_lai, hien_thi_cong_khai, thoi_gian_danh_gia) FROM stdin;
\.


--
-- Data for Name: danh_muc_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_muc_dich_vu (id, ten_danh_muc, mo_ta, thu_tu_hien_thi, an_hien, loai_danh_muc) FROM stdin;
1	Khám Bệnh & Lượng Giá Chuyên Sâu	Dịch vụ chẩn đoán lâm sàng, đo tầm vận động khớp và lập phác đồ	1	t	dich_vu
2	Trị Liệu Bằng Tay & Nắn Chỉnh	Giải phóng cơ sâu, di động khớp và nắn chỉnh cột sống	2	t	dich_vu
3	Vật Lý Trị Liệu Công Nghệ Cao	Các liệu pháp nhiệt, điện xung, siêu âm, laser công suất cao và sóng xung kích	3	t	dich_vu
4	Vận Động Trị Liệu Phục Hồi Chức Năng	Tập vận động tích cực ổn định hệ cơ lõi và phục hồi dáng đi	4	t	dich_vu
\.


--
-- Data for Name: dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dich_vu (id, danh_muc_id, ten_dich_vu, mo_ta_ngan, mo_ta_chi_tiet, thoi_luong_phut, don_gia, hinh_anh_url, trang_thai, thu_tu_hien_thi, thiet_bi_yeu_cau, loai_dich_vu, hien_thi_website, loai_dich_vu_ho_tro) FROM stdin;
d1000000-0000-0000-0000-000000000001	1	Khám lâm sàng & Lượng giá chức năng cơ xương khớp	Bác sĩ kiểm tra tầm vận động, sức mạnh cơ và lập phác đồ trị liệu	\N	30	200000	\N	hoat_dong	0	Thước đo khớp, Búa phản xạ	chinh	t	[]
d2000000-0000-0000-0000-000000000001	2	Trị liệu giải phóng cơ sâu & màng cơ - Myofascial Release	Giải phóng căng thẳng các điểm đau kích hoạt vùng cổ vai gáy và thắt lưng	\N	45	350000	\N	hoat_dong	0	Giường trị liệu bằng tay	chinh	t	[]
d2000000-0000-0000-0000-000000000002	2	Di động khớp & Nắn chỉnh cột sống - Chiropractic	Khôi phục tầm vận động của các đốt sống khớp và cải thiện hệ thần kinh	\N	30	400000	\N	hoat_dong	0	Giường nắn chỉnh xương khớp chuyên dụng	chinh	t	[]
d3000000-0000-0000-0000-000000000001	3	Trị liệu Laser công suất cao giảm sưng viêm	Kích thích sinh học tế bào giúp lành thương nhanh vùng gân, dây chằng	\N	15	250000	\N	hoat_dong	0	Máy Laser công suất cao	ho_tro	t	[]
d3000000-0000-0000-0000-000000000002	3	Trị liệu sóng xung kích hội tụ - Focused Shockwave	Phá tan xơ hóa, thúc đẩy tái tạo mạch máu mới vùng gót chân, khớp gối	\N	20	300000	\N	hoat_dong	0	Máy sóng xung kích Shockwave	ho_tro	t	[]
d3000000-0000-0000-0000-000000000003	3	Siêu âm trị liệu sâu giải áp điểm đau cơ	Nhiệt sâu cơ học giúp tăng tuần hoàn cục bộ và giảm co thắt cơ	\N	15	200000	\N	hoat_dong	0	Máy siêu âm điều trị	ho_tro	t	[]
d3000000-0000-0000-0000-000000000004	3	Kéo giãn cột sống cổ/thắt lưng giải áp đĩa đệm	Kéo giãn cơ học giúp gia tăng khoảng cách đốt sống và giảm chèn ép rễ thần kinh	\N	20	200000	\N	hoat_dong	0	Máy kéo giãn cột sống tự động	ho_tro	t	[]
d4000000-0000-0000-0000-000000000001	4	Tập vận động phục hồi chức năng chuyên biệt - Kinetic Rehab	Các bài tập kéo giãn cơ chủ động, củng cố sức mạnh nhóm cơ yếu dưới sự giám sát	\N	45	300000	\N	hoat_dong	0	Thảm tập, Dây kháng lực, Bóng yoga	chinh	t	[]
d4000000-0000-0000-0000-000000000002	4	Tập ổn định khớp & Phục hồi chức năng cột sống cổ vai gáy	Cải thiện tư thế, gia tăng sức mạnh hệ cơ lõi và cơ ổn định cột sống cổ	\N	45	300000	\N	hoat_dong	0	Bóng tập, Gậy gỗ, Máy tập đa năng	chinh	t	[]
\.


--
-- Data for Name: goi_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goi_dich_vu (id, ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, thoi_gian_tao, danh_muc_id, loai_goi, so_dv_toi_da_moi_buoi, phan_tram_giam_tra_thang, phan_tram_giam_tra_gop) FROM stdin;
c1000000-0000-0000-0000-000000000001	Gói Phục Hồi Cột Sống & Đau Vai Gáy Chuyên Sâu	GOI-VAIGAY-BASIC	Liệu trình giảm co thắt, phục hồi tầm vận động vùng vai gáy và giải chèn ép rễ thần kinh cánh tay.	8	3200000	4000000	6	t	hoat_dong	2026-06-24 22:45:20.207016+07	2	lieu_trinh	5	10	5
c1000000-0000-0000-0000-000000000002	Gói Trị Liệu Thoát Vị Đĩa Đệm Giải Áp Cột Sống Thắt Lưng	GOI-DIA-DEM	Phác đồ kết hợp di động cột sống bằng tay, máy kéo giãn áp lực âm và tập ổn định nhóm cơ lõi cốt lõi.	10	4500000	5500000	6	t	hoat_dong	2026-06-24 22:45:20.207016+07	3	lieu_trinh	5	10	5
c1000000-0000-0000-0000-000000000003	Gói Phục Hồi Chấn Thương Thể Thao & Viêm Gân Cấp	GOI-THE-THAO	Tập trung trị liệu giảm đau nhanh bằng laser công suất cao kết hợp sóng xung kích hội tụ và PHCN khớp gối/cổ chân.	12	5400000	6600000	6	t	hoat_dong	2026-06-24 22:45:20.207016+07	4	lieu_trinh	5	10	5
\.


--
-- Data for Name: goi_dich_vu_chi_tiet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goi_dich_vu_chi_tiet (id, goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi, so_lan_toi_da_trong_goi, bat_buoc, thu_tu_thuc_hien) FROM stdin;
37	c1000000-0000-0000-0000-000000000001	d2000000-0000-0000-0000-000000000001	8	8	t	1
38	c1000000-0000-0000-0000-000000000001	d3000000-0000-0000-0000-000000000003	8	8	t	2
39	c1000000-0000-0000-0000-000000000001	d4000000-0000-0000-0000-000000000002	8	8	f	3
40	c1000000-0000-0000-0000-000000000002	d2000000-0000-0000-0000-000000000002	10	10	t	1
41	c1000000-0000-0000-0000-000000000002	d3000000-0000-0000-0000-000000000004	10	10	t	2
42	c1000000-0000-0000-0000-000000000002	d4000000-0000-0000-0000-000000000001	10	10	f	3
43	c1000000-0000-0000-0000-000000000003	d3000000-0000-0000-0000-000000000001	12	12	t	1
44	c1000000-0000-0000-0000-000000000003	d3000000-0000-0000-0000-000000000002	12	12	t	2
45	c1000000-0000-0000-0000-000000000003	d4000000-0000-0000-0000-000000000001	12	12	t	3
\.


--
-- Data for Name: ho_so_dieu_tri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ho_so_dieu_tri (id, lich_dat_id, chuyen_gia_id, chan_doan, chong_chi_dinh, goi_dich_vu_id, dich_vu_id, ghi_chu, thoi_gian_tao) FROM stdin;
\.


--
-- Data for Name: hoa_don; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hoa_don (id, ma_hoa_don, khach_hang_id, loai_hoa_don, tong_tien_truoc_giam, so_tien_giam, tong_tien_thanh_toan, da_thanh_toan, trang_thai, ghi_chu, ngay_tao, ngay_thanh_toan, thu_boi, loai_thanh_toan, voucher_id, so_tien_giam_voucher, so_tien_giam_phuong_thuc, lich_dieu_tri_id) FROM stdin;
\.


--
-- Data for Name: khach_hang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khach_hang (id, ho_ten, email, so_dien_thoai, mat_khau_hash, trang_thai, da_xac_thuc_email, avatar_url, lan_dang_nhap_cuoi, ngay_sinh, gioi_tinh, dia_chi, thoi_gian_tao, deleted_at) FROM stdin;
10000000-0000-0000-0000-000000000011	Nguyễn Văn An	kh1@gmail.com	0912000011	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	hoat_dong	t	\N	\N	1988-03-15	nam	12 Nguyễn Huệ, Q1, TP.HCM	2026-06-24 22:43:31.357369	\N
10000000-0000-0000-0000-000000000012	Trần Thị Bảo	kh2@gmail.com	0912000012	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	hoat_dong	t	\N	\N	1992-07-22	nu	45 Lê Lợi, Q1, TP.HCM	2026-06-24 22:43:31.357369	\N
10000000-0000-0000-0000-000000000013	Lê Quang Cường	kh3@gmail.com	0912000013	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	hoat_dong	t	\N	\N	1985-11-08	nam	78 Trần Hưng Đạo, Q5, TP.HCM	2026-06-24 22:43:31.357369	\N
10000000-0000-0000-0000-000000000014	Phạm Thị Dung	kh4@gmail.com	0912000014	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	hoat_dong	t	\N	\N	1995-04-30	nu	23 Điện Biên Phủ, Q3, TP.HCM	2026-06-24 22:43:31.357369	\N
10000000-0000-0000-0000-000000000015	Hoàng Văn Đức	kh5@gmail.com	0912000015	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	hoat_dong	t	\N	\N	1990-09-17	nam	56 Võ Văn Tần, Q3, TP.HCM	2026-06-24 22:43:31.357369	\N
\.


--
-- Data for Name: lich_dat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, bac_si_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url, trang_thai, ghi_chu_dat_lich, ghi_chu_noi_bo, thoi_gian_checkin, thoi_gian_huy, ly_do_huy, nguoi_tao, thoi_gian_tao, han_xac_nhan) FROM stdin;
60000000-0000-0000-0000-000000000001	LH-DEMO-01	10000000-0000-0000-0000-000000000011	Nguyễn Văn Hùng	0901112223	nam	d1000000-0000-0000-0000-000000000001	\N	\N	2026-06-25 08:00:00+07	2026-06-25 08:30:00+07	Đau cột sống thắt lưng ê ẩm	\N	chua_xac_nhan	\N	\N	\N	\N	\N	he_thong	2026-06-24 22:00:00+07	2026-06-25 08:00:00+07
60000000-0000-0000-0000-000000000002	LH-DEMO-02	10000000-0000-0000-0000-000000000012	Trần Minh Quân	0903334445	nam	d1000000-0000-0000-0000-000000000001	\N	\N	2026-06-25 09:00:00+07	2026-06-25 09:30:00+07	Khám tầm soát vẹo cột sống cổ	\N	cho_xac_nhan	\N	\N	\N	\N	\N	he_thong	2026-06-24 21:00:00+07	\N
60000000-0000-0000-0000-000000000003	LH-DEMO-03	10000000-0000-0000-0000-000000000013	Lê Thị Thảo	0902223334	nu	d2000000-0000-0000-0000-000000000001	20000000-0000-0000-0000-000000000006	2	2026-06-25 10:00:00+07	2026-06-25 10:30:00+07	Đau mỏi bả vai lan xuống cánh tay	\N	da_xac_nhan	\N	\N	\N	\N	\N	he_thong	2026-06-24 18:00:00+07	\N
60000000-0000-0000-0000-000000000004	LH-DEMO-04	10000000-0000-0000-0000-000000000014	Phạm Hồng Nhung	0904445556	nu	d1000000-0000-0000-0000-000000000001	20000000-0000-0000-0000-000000000005	1	2026-06-25 11:00:00+07	2026-06-25 11:30:00+07	Khám tầm vận động sau chấn thương đầu gối	\N	da_checkin	\N	\N	\N	\N	\N	he_thong	2026-06-24 15:00:00+07	\N
60000000-0000-0000-0000-000000000005	LH-DEMO-05	10000000-0000-0000-0000-000000000015	Đỗ Quốc Đạt	0905556667	nam	d2000000-0000-0000-0000-000000000001	20000000-0000-0000-0000-000000000005	1	2026-06-25 14:00:00+07	2026-06-25 14:30:00+07	Giải phóng điểm đau kích hoạt vùng thắt lưng	\N	dang_kham	\N	\N	\N	\N	\N	he_thong	2026-06-24 14:00:00+07	\N
60000000-0000-0000-0000-000000000006	LH-DEMO-06	10000000-0000-0000-0000-000000000011	Phan Thanh Sơn	0907778889	nam	d1000000-0000-0000-0000-000000000001	20000000-0000-0000-0000-000000000006	2	2026-06-25 15:00:00+07	2026-06-25 15:30:00+07	Khám phục hồi chức năng thắt lưng	\N	hoan_thanh	\N	\N	\N	\N	\N	he_thong	2026-06-24 09:00:00+07	\N
60000000-0000-0000-0000-000000000007	LH-DEMO-07	10000000-0000-0000-0000-000000000012	Ngô Hoàng Nam	0906667778	nam	d1000000-0000-0000-0000-000000000001	\N	\N	2026-06-25 16:00:00+07	2026-06-25 16:30:00+07	Đau vai gáy cấp tính	\N	da_huy	\N	\N	\N	\N	Khách báo bận đi công tác đột xuất	he_thong	2026-06-24 08:00:00+07	\N
f34ac831-ffe4-4987-ba5c-447fab02feb8	LD-52642	\N	Nguyễn Văn Test	0912345678	nam	d1000000-0000-0000-0000-000000000001	\N	\N	2026-06-25 00:45:32.799+07	2026-06-25 01:15:32.799+07	Đau cổ vai gáy cấp tính	\N	chua_xac_nhan	\N	\N	\N	\N	\N	guest	2026-06-24 22:45:32.964305+07	2026-06-25 00:45:32.799+07
b59c7ba7-19d9-487f-a128-8ce1104feecf	LD-95527	\N	Nguyễn Admin Hệ Thống	0398655532	nam	\N	\N	\N	2026-06-25 11:30:00+07	2026-06-25 12:00:00+07	Khám lượng giá ban đầu	\N	chua_xac_nhan	\N	\N	\N	\N	\N	guest	2026-06-24 23:06:08.640055+07	2026-06-25 08:30:00+07
d225f529-b677-4672-9b32-1fdd01c739e0	LD-93354	\N	Nguyễn Admin Hệ Thống	0398655532	nam	\N	\N	\N	2026-06-25 11:30:00+07	2026-06-25 12:00:00+07	Khám lượng giá ban đầu	\N	chua_xac_nhan	\N	\N	\N	\N	\N	guest	2026-06-24 23:07:41.939149+07	2026-06-25 08:30:00+07
\.


--
-- Data for Name: lich_dieu_tri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_dieu_tri (id, khach_hang_id, loai_dieu_tri, tong_so_buoi, so_buoi_da_dung, trang_thai, thoi_gian_tao, ma_lich_dieu_tri, phong_id, ghi_chu_noi_bo, ngay_bat_dau, ngay_ket_thuc, ho_so_dieu_tri_id) FROM stdin;
\.


--
-- Data for Name: lich_lam_viec; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_lam_viec (id, nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai, thoi_gian_checkin, thoi_gian_checkout, trang_thai_cham_cong, phong_id, giuong_so) FROM stdin;
ce831eca-b958-49c6-9c25-131ef629e667	00000000-0000-0000-0000-000000000005	2026-06-24	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
363b1775-5d9f-4778-a5ba-94722f68e335	00000000-0000-0000-0000-000000000006	2026-06-24	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
273169b8-91e9-498a-a2a3-29f8cca3f55c	00000000-0000-0000-0000-000000000007	2026-06-24	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
ae98afa7-1afc-449b-a9b9-166cf50df0b2	00000000-0000-0000-0000-000000000008	2026-06-24	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
5bc5d179-89bf-452c-b745-f522ec70fb26	00000000-0000-0000-0000-000000000009	2026-06-24	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
1f02015a-7bbc-4737-9556-e544180ea8e4	00000000-0000-0000-0000-000000000010	2026-06-24	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
ef88541d-8ec9-4632-a8bf-f10b2338d22d	00000000-0000-0000-0000-000000000005	2026-06-25	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
23e6dcae-789c-4ba9-9889-5a230ecab88a	00000000-0000-0000-0000-000000000006	2026-06-25	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
23c40930-aebb-458d-926f-71919a5ad033	00000000-0000-0000-0000-000000000007	2026-06-25	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
c3b113b8-dc92-4986-bbc7-8287c868c806	00000000-0000-0000-0000-000000000008	2026-06-25	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
6dc8d20c-0515-4ee0-8184-ca476219720a	00000000-0000-0000-0000-000000000009	2026-06-25	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
c68fc6bf-9ac5-4d68-b83c-463de65695f6	00000000-0000-0000-0000-000000000010	2026-06-25	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
98c23fee-f23f-4d99-a35b-0421d10c13b7	00000000-0000-0000-0000-000000000005	2026-06-26	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
84a36c38-9fa8-46a7-bc3e-bd52caf8d994	00000000-0000-0000-0000-000000000006	2026-06-26	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
418d892b-67a7-4863-b141-ed0e6476afd6	00000000-0000-0000-0000-000000000007	2026-06-26	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
2d2d991c-7547-4bda-927d-3b750a178408	00000000-0000-0000-0000-000000000008	2026-06-26	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
48364a52-2b0d-42c2-8949-bd52d27942a4	00000000-0000-0000-0000-000000000009	2026-06-26	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
f3aa0dfe-6224-44fe-a886-25eaddf5427d	00000000-0000-0000-0000-000000000010	2026-06-26	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
cf468252-3626-4ed9-81ef-24ba3eb5cd06	00000000-0000-0000-0000-000000000005	2026-06-27	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
01d9f4e2-7c10-4ca6-ab23-51e6820f4a68	00000000-0000-0000-0000-000000000006	2026-06-27	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
79ef0159-cf55-4cfc-82c6-355cbe93e10d	00000000-0000-0000-0000-000000000007	2026-06-27	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
536ec6d0-37b1-489a-8804-89c955158d13	00000000-0000-0000-0000-000000000008	2026-06-27	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
e24ebdc4-afab-427a-b234-e88590e45a19	00000000-0000-0000-0000-000000000009	2026-06-27	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
e86a2e4e-f35e-4023-9f1d-31eef77b1c39	00000000-0000-0000-0000-000000000010	2026-06-27	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
a893f50e-55c2-45de-b6d2-0474f3f8ae5c	00000000-0000-0000-0000-000000000005	2026-06-28	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
6db87466-3d34-4dd7-9729-9dbc6cb8ff00	00000000-0000-0000-0000-000000000006	2026-06-28	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
f4ce913c-4e05-4103-874b-3e80155381fd	00000000-0000-0000-0000-000000000007	2026-06-28	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
66937ea9-f02e-4fb4-9d6f-f824ba1c7d68	00000000-0000-0000-0000-000000000008	2026-06-28	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
e9235c63-6771-429f-81d5-6ae0f8ad643b	00000000-0000-0000-0000-000000000009	2026-06-28	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
22483967-393a-4803-8c02-097f6335a8d5	00000000-0000-0000-0000-000000000010	2026-06-28	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
3e01dcf8-8804-4e5a-a652-9b6b6dbd872f	00000000-0000-0000-0000-000000000005	2026-06-29	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
c20ceb51-34c3-4d27-9d5d-0cce5d5ef103	00000000-0000-0000-0000-000000000006	2026-06-29	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
b51581a6-d90b-472d-877d-3d4fc387186f	00000000-0000-0000-0000-000000000007	2026-06-29	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
52a54165-9731-4a53-b1f4-2d8c22487a64	00000000-0000-0000-0000-000000000008	2026-06-29	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
74aade8f-4a8d-4112-8f92-e75bb41da6d3	00000000-0000-0000-0000-000000000009	2026-06-29	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
74ad93ae-3990-4cb4-ab94-0bd9cca6a162	00000000-0000-0000-0000-000000000010	2026-06-29	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
9a197b0a-2580-4633-a606-28acebd6bd9a	00000000-0000-0000-0000-000000000005	2026-06-30	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
24a32cc7-f253-48ee-9ed5-8f9e3d65abe1	00000000-0000-0000-0000-000000000006	2026-06-30	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
3583db67-eeb4-4298-a1f6-3273a6f71bdd	00000000-0000-0000-0000-000000000007	2026-06-30	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
41ccef45-2d89-47b4-8a3c-d644860dcfbb	00000000-0000-0000-0000-000000000008	2026-06-30	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
8a7fbcb7-e96e-4733-ac06-8d895b32c5ba	00000000-0000-0000-0000-000000000009	2026-06-30	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
22832700-4c4f-4fad-8c48-b80c9add153b	00000000-0000-0000-0000-000000000010	2026-06-30	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
02a6fdb5-3570-4f9e-ac83-4399e8f88d53	00000000-0000-0000-0000-000000000005	2026-07-01	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
a3d4660f-cdb5-407b-9b52-334fe393a4b5	00000000-0000-0000-0000-000000000006	2026-07-01	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
343a8548-dd90-4c70-a2e7-d41f9f506338	00000000-0000-0000-0000-000000000007	2026-07-01	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
e676f1dd-c636-4b20-b9d6-e50dcdea6f39	00000000-0000-0000-0000-000000000008	2026-07-01	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
d179d482-ab80-43b7-87b0-8206ad5b7239	00000000-0000-0000-0000-000000000009	2026-07-01	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
266ce3e6-0730-4110-8e23-03c3bef7487f	00000000-0000-0000-0000-000000000010	2026-07-01	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
eab2fad8-38e5-48be-8c10-4d0768d91d77	00000000-0000-0000-0000-000000000005	2026-07-02	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
2e0a2edf-27b7-4937-ad40-99a03d9624ec	00000000-0000-0000-0000-000000000006	2026-07-02	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
93456e73-6d0a-4265-bac7-a8abef44346e	00000000-0000-0000-0000-000000000007	2026-07-02	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
b60cb9a3-a144-4cc7-b964-d0cfab3b1268	00000000-0000-0000-0000-000000000008	2026-07-02	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
edb9dccc-39b8-4313-8138-0f2bc8c4fc5f	00000000-0000-0000-0000-000000000009	2026-07-02	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
6b460625-a2df-4645-be9e-c41fd68ba088	00000000-0000-0000-0000-000000000010	2026-07-02	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
71d0d559-c599-42a6-9346-e13e56cc1b7c	00000000-0000-0000-0000-000000000005	2026-07-03	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
be9e9f79-33a8-4259-9f3a-d2c26c930adc	00000000-0000-0000-0000-000000000006	2026-07-03	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
bcafe9bd-4c77-4036-8362-7aae991df514	00000000-0000-0000-0000-000000000007	2026-07-03	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
ec6e5270-eef3-4e2c-8d2d-eab16df3ceff	00000000-0000-0000-0000-000000000008	2026-07-03	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
067ac5ae-46ad-4f04-9954-dc9cf401225d	00000000-0000-0000-0000-000000000009	2026-07-03	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
7ac946ac-c697-4d65-95cb-8b706aa9d71e	00000000-0000-0000-0000-000000000010	2026-07-03	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
c27dda82-2ffb-4d85-b1d0-eca28fa60388	00000000-0000-0000-0000-000000000005	2026-07-04	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
9c31d72c-fce7-46f1-8970-e8810606e578	00000000-0000-0000-0000-000000000006	2026-07-04	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
5373a180-dcd2-49d6-bfea-16f602557670	00000000-0000-0000-0000-000000000007	2026-07-04	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
ae848fa9-cd25-4fd5-a165-c7b3dd512dc8	00000000-0000-0000-0000-000000000008	2026-07-04	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
121a41c5-bfaf-4acf-acc8-8dec42e09db4	00000000-0000-0000-0000-000000000009	2026-07-04	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
6c9233d4-8737-4d5d-b706-572679713377	00000000-0000-0000-0000-000000000010	2026-07-04	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
0e140f94-b991-4922-82b0-c3d54ce52d4b	00000000-0000-0000-0000-000000000005	2026-07-05	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
c752b378-63e0-426c-939a-a63f540c3559	00000000-0000-0000-0000-000000000006	2026-07-05	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
8f127296-9434-4248-ae3d-6483fe9a2940	00000000-0000-0000-0000-000000000007	2026-07-05	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
d3d4929f-66d3-4edd-adef-6c58c6dd5d36	00000000-0000-0000-0000-000000000008	2026-07-05	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
1eebb255-dde8-4856-b9d5-f5dc1d51fa07	00000000-0000-0000-0000-000000000009	2026-07-05	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
16d3e9b8-a157-453a-9ae3-c9488d3d0bb0	00000000-0000-0000-0000-000000000010	2026-07-05	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
e0bacdca-6cee-4e9d-9ce6-592701c2e982	00000000-0000-0000-0000-000000000005	2026-07-06	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
2386e8f4-0a0c-4fa9-8d65-e68b94d59048	00000000-0000-0000-0000-000000000006	2026-07-06	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
baf0040b-9519-437f-b4bf-a073d4eec092	00000000-0000-0000-0000-000000000007	2026-07-06	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
1fc04337-ffd4-45de-91e9-8bd2b041b3d9	00000000-0000-0000-0000-000000000008	2026-07-06	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
3f0b4444-0b51-442a-9426-007ae8eee857	00000000-0000-0000-0000-000000000009	2026-07-06	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
7e199a19-0fe5-428b-a869-bd7d417d0881	00000000-0000-0000-0000-000000000010	2026-07-06	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
163cf194-bc48-4e7c-a419-03ad387906ba	00000000-0000-0000-0000-000000000005	2026-07-07	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
2865b4ac-482a-40f1-8a87-082ea8fde371	00000000-0000-0000-0000-000000000006	2026-07-07	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
10582680-fd74-434b-8033-5e5976ac9fba	00000000-0000-0000-0000-000000000007	2026-07-07	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
f6e2f090-4a67-46eb-800f-356e90909f45	00000000-0000-0000-0000-000000000008	2026-07-07	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
b1d50764-01ab-423f-842e-b06490b4c8e1	00000000-0000-0000-0000-000000000009	2026-07-07	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
f22a60a4-f412-4d17-980d-f2b172989ab2	00000000-0000-0000-0000-000000000010	2026-07-07	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
e24c753b-5988-461f-bd5e-b644ac88d1d4	00000000-0000-0000-0000-000000000005	2026-07-08	08:00:00	17:00:00	hoat_dong	\N	\N	\N	1	\N
d1067e0e-f381-4ced-9fb5-4294d74d5aeb	00000000-0000-0000-0000-000000000006	2026-07-08	08:00:00	17:00:00	hoat_dong	\N	\N	\N	2	\N
21b69083-1f00-47e6-841d-908ad27bb5b6	00000000-0000-0000-0000-000000000007	2026-07-08	08:00:00	17:00:00	hoat_dong	\N	\N	\N	7	1
4216d45e-1b49-4d0d-b98e-1c98a353b9b6	00000000-0000-0000-0000-000000000008	2026-07-08	08:00:00	17:00:00	hoat_dong	\N	\N	\N	4	1
27c8933f-21b6-41ed-8bd9-7e331188c9e4	00000000-0000-0000-0000-000000000009	2026-07-08	08:00:00	17:00:00	hoat_dong	\N	\N	\N	5	1
ee99a591-7f5d-46c5-bfef-8e03d4354e55	00000000-0000-0000-0000-000000000010	2026-07-08	08:00:00	17:00:00	hoat_dong	\N	\N	\N	3	1
\.


--
-- Data for Name: nguoi_dung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nguoi_dung (id, ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email, avatar_url, thoi_gian_tao, lan_dang_nhap_cuoi, deleted_at) FROM stdin;
00000000-0000-0000-0000-000000000002	Trần Minh Quản Lý	quanly@physioflow.vn	0901000002	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	6	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000003	Lê Thị Hoa	letan1@physioflow.vn	0901000003	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	2	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000004	Phạm Ngọc Mai	letan2@physioflow.vn	0901000004	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	2	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000005	BS. Nguyễn Văn Khoa	bacsi1@physioflow.vn	0901000005	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	4	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000006	BS. Trần Thị Lan Anh	bacsi2@physioflow.vn	0901000006	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	4	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000007	KTV. Đỗ Thanh Tùng	ktv1@physioflow.vn	0901000007	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	3	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000008	KTV. Nguyễn Thị Bích	ktv2@physioflow.vn	0901000008	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	3	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000009	KTV. Hoàng Văn Minh	ktv3@physioflow.vn	0901000009	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	3	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000010	KTV. Vũ Thị Thanh	ktv4@physioflow.vn	0901000010	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	3	hoat_dong	t	\N	2026-06-24 22:43:31.352276	\N	\N
00000000-0000-0000-0000-000000000001	Nguyễn Admin Hệ Thống	admin@gmail.com	0901000001	$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S	5	hoat_dong	t	\N	2026-06-24 22:43:31.352276	2026-06-24 15:44:10.39	\N
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, email, otp, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: phong; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phong (id, ten_phong, ma_phong, loai_phong, mo_ta, trang_thai, tang, so_luong_giuong) FROM stdin;
1	Phòng Lượng Giá & Khám Lâm Sàng 1	P101	kham_benh	Phòng chẩn đoán lâm sàng của BS. Khoa	san_sang	Tầng 1	1
2	Phòng Lượng Giá & Khám Lâm Sàng 2	P102	kham_benh	Phòng chẩn đoán cột sống & tư thế của BS. Lan Anh	san_sang	Tầng 1	1
3	Phòng Tập Vận Động Trị Liệu & PHCN	P201	phong_tap_phcn	Khu vực tập vận động tích cực, tập dáng đi và thăng bằng	san_sang	Tầng 2	4
4	Phòng Điện Trị Liệu & Laser Công Suất Cao	P301	phong_tri_lieu_chuan	Phòng máy vật lý trị liệu giảm sưng viêm	san_sang	Tầng 3	3
5	Phòng Kéo Giãn Giải Áp & Từ Trường	P302	phong_tri_lieu_chuan	Phòng điều trị thoái vị đĩa đệm, giải áp cột sống	san_sang	Tầng 3	3
6	Phòng Trị Liệu Bằng Sóng Cơ Học & Siêu Âm	P303	phong_tri_lieu_chuan	Shockwave và Ultrasound tập trung giải điểm đau	san_sang	Tầng 3	2
7	Phòng Trị Liệu Cơ Xương Khớp Bằng Tay 1	P401	phong_tri_lieu_chuan	Khu vực nắn chỉnh, di động khớp và trị liệu bằng tay	san_sang	Tầng 4	2
8	Phòng Trị Liệu Cơ Xương Khớp Bằng Tay 2	P402	phong_tri_lieu_chuan	Khu vực nắn chỉnh giải phóng màng cơ sâu	san_sang	Tầng 4	2
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, nguoi_dung_id, khach_hang_id, token, expires_at, created_at) FROM stdin;
19	00000000-0000-0000-0000-000000000001	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImlhdCI6MTc4MjMxNTg1MCwiZXhwIjoxNzgyOTIwNjUwfQ.BcrbbsnzRvxw6vjxi7TWeaSeq3_QIdtWaqH9DywNO5w	2026-07-01 15:44:10.338	2026-06-24 15:44:10.363
\.


--
-- Data for Name: thanh_toan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thanh_toan (id, ma_giao_dich, hoa_don_id, so_tien, phuong_thuc, trang_thai, ma_tham_chieu, nguoi_thu_tien_id, thoi_gian_giao_dich, ghi_chu) FROM stdin;
\.


--
-- Data for Name: thiet_bi_y_te; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thiet_bi_y_te (id, ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, trang_thai, phong_id_hien_tai, ghi_chu, thoi_gian_tao, so_lan_su_dung, nguong_canh_bao, nguong_bat_buoc_bao_tri, tan_suat_bao_tri_ngay, ngay_bao_tri_gan_nhat, cap_rui_ro) FROM stdin;
2d683a12-50c1-4353-bf12-911bf6fd9701	EQP-GONIO	Thước đo khớp cơ học	Thước đo khớp	\N	san_sang	1	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
7df789ef-d999-4469-a351-c7e84d1865f9	EQP-HAMMER	Búa phản xạ thần kinh Taylor	Búa phản xạ	\N	san_sang	1	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
b0f6662c-f5de-4666-a8c6-c28c0532ddfc	EQP-BED01	Giường trị liệu bằng tay cao cấp 01	Giường trị liệu bằng tay	\N	san_sang	7	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
a79e8cf9-4b4a-49f3-a21f-cade60e5ab07	EQP-BED02	Giường trị liệu bằng tay cao cấp 02	Giường trị liệu bằng tay	\N	san_sang	8	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
386ef5da-c593-4af0-ae6f-f1e35b7b3752	EQP-CHIRO	Giường nắn chỉnh xương khớp chuyên dụng Chiro-Max	Giường nắn chỉnh xương khớp chuyên dụng	\N	san_sang	7	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
ab31dd11-edb5-48b4-a9a6-de685556588f	EQP-LASER	Máy Laser công suất cao BTL-6000 20W	Máy Laser công suất cao	\N	san_sang	4	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
764711e7-a214-4ce3-a367-478fbbe00fe1	EQP-SHOCK	Máy sóng xung kích Shockwave BTL-6000	Máy sóng xung kích Shockwave	\N	san_sang	6	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
1df37cf4-cf0b-48ef-8117-12b53e15266d	EQP-ULTRA	Máy siêu âm điều trị đa tần BTL-4710	Máy siêu âm điều trị	\N	san_sang	6	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
b8592dcb-ba83-415c-8578-bb969d1b1917	EQP-TRITON	Máy kéo giãn cột sống tự động Triton DTS	Máy kéo giãn cột sống tự động	\N	san_sang	5	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
077fc16b-9642-4316-95b9-61c4bc45f061	EQP-MAT	Thảm tập Kinetic Rehab	Thảm tập	\N	san_sang	3	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
1e1bba6e-0a67-46a3-bf81-82c139a244fc	EQP-BAND	Dây kháng lực Theraband	Dây kháng lực	\N	san_sang	3	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
39621dd4-466a-459b-ac3c-701ebcd7a6c0	EQP-YOGA	Bóng yoga tròn	Bóng yoga	\N	san_sang	3	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
f6a5c0c1-c9b1-48b9-811e-25d553f27bd3	EQP-BALL	Bóng tập giữ thăng bằng	Bóng tập	\N	san_sang	3	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
5b386a10-13da-4380-86ce-ee09459f2276	EQP-STICK	Gậy gỗ tập vận động khớp vai	Gậy gỗ	\N	san_sang	3	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
cebe2206-9f35-40e3-ac0e-48b3a8692626	EQP-MULTI	Máy tập đa năng phục hồi chức năng	Máy tập đa năng	\N	san_sang	3	Dữ liệu được seed tự động.	2026-06-24 22:45:20.207016	0	80	100	45	\N	trung_binh
\.


--
-- Data for Name: thong_bao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thong_bao (id, nguoi_dung_id, khach_hang_id, tieu_de, noi_dung, loai, da_doc, thoi_gian_tao) FROM stdin;
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
6	quan_ly	Quản lý	Quản lý chung hệ thống phòng khám, nhân sự và tài chính
\.


--
-- Data for Name: voucher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voucher (id, ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_toi_da, so_luong_da_dung, ngay_bat_dau, ngay_het_han, tao_boi, trang_thai, thoi_gian_tao, yeu_cau_thanh_toan) FROM stdin;
89696b05-0b92-4f1c-8504-571aec1fad34	SUMMER2024	Khuyến mãi Hè 2024	phan_tram	15	\N	500000	\N	0	2026-05-11	2026-07-11	00000000-0000-0000-0000-000000000001	hoat_dong	2026-06-13 10:33:28.583	tat_ca
972c9a8a-c23f-40c6-87e5-9dfb51543284	NEWUSER	Khách hàng mới	so_tien_co_dinh	100000	\N	0	\N	0	2025-06-11	2027-06-11	00000000-0000-0000-0000-000000000001	hoat_dong	2026-06-13 10:33:28.583	tat_ca
\.


--
-- Name: danh_muc_dich_vu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.danh_muc_dich_vu_id_seq', 1, false);


--
-- Name: goi_dich_vu_chi_tiet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goi_dich_vu_chi_tiet_id_seq', 45, true);


--
-- Name: phong_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phong_id_seq', 1, false);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 19, true);


--
-- Name: vai_tro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vai_tro_id_seq', 1, false);


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
-- Name: goi_dich_vu goi_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: ho_so_dieu_tri ho_so_dieu_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_dieu_tri
    ADD CONSTRAINT ho_so_dieu_tri_pkey PRIMARY KEY (id);


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
-- Name: goi_dich_vu_ma_goi_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX goi_dich_vu_ma_goi_key ON public.goi_dich_vu USING btree (ma_goi);


--
-- Name: ho_so_dieu_tri_lich_dat_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ho_so_dieu_tri_lich_dat_id_key ON public.ho_so_dieu_tri USING btree (lich_dat_id);


--
-- Name: idx_hsdt_lich_dat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hsdt_lich_dat ON public.ho_so_dieu_tri USING btree (lich_dat_id);


--
-- Name: idx_ldt_hsdt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ldt_hsdt ON public.lich_dieu_tri USING btree (ho_so_dieu_tri_id);


--
-- Name: idx_thong_bao_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_thong_bao_customer ON public.thong_bao USING btree (khach_hang_id);


--
-- Name: idx_thong_bao_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_thong_bao_user ON public.thong_bao USING btree (nguoi_dung_id);


--
-- Name: khach_hang_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX khach_hang_email_key ON public.khach_hang USING btree (email);


--
-- Name: lich_dieu_tri_ma_lich_dieu_tri_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX lich_dieu_tri_ma_lich_dieu_tri_key ON public.lich_dieu_tri USING btree (ma_lich_dieu_tri);


--
-- Name: thiet_bi_y_te_ma_thiet_bi_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX thiet_bi_y_te_ma_thiet_bi_key ON public.thiet_bi_y_te USING btree (ma_thiet_bi);


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
-- Name: buoi_tri_lieu_dich_vu fk_btldv_duyet_boi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu_dich_vu
    ADD CONSTRAINT fk_btldv_duyet_boi FOREIGN KEY (duyet_boi) REFERENCES public.nguoi_dung(id) ON DELETE SET NULL;


--
-- Name: buoi_tri_lieu_dich_vu fk_btldv_ktv; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu_dich_vu
    ADD CONSTRAINT fk_btldv_ktv FOREIGN KEY (ktv_id) REFERENCES public.chuyen_gia_y_te(id) ON DELETE SET NULL;


--
-- Name: ho_so_dieu_tri fk_hsdt_chuyen_gia; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_dieu_tri
    ADD CONSTRAINT fk_hsdt_chuyen_gia FOREIGN KEY (chuyen_gia_id) REFERENCES public.chuyen_gia_y_te(id) ON DELETE SET NULL;


--
-- Name: ho_so_dieu_tri fk_hsdt_dich_vu; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_dieu_tri
    ADD CONSTRAINT fk_hsdt_dich_vu FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id) ON DELETE SET NULL;


--
-- Name: ho_so_dieu_tri fk_hsdt_goi_dich_vu; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_dieu_tri
    ADD CONSTRAINT fk_hsdt_goi_dich_vu FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id) ON DELETE SET NULL;


--
-- Name: ho_so_dieu_tri fk_hsdt_lich_dat; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_dieu_tri
    ADD CONSTRAINT fk_hsdt_lich_dat FOREIGN KEY (lich_dat_id) REFERENCES public.lich_dat(id) ON DELETE CASCADE;


--
-- Name: lich_dieu_tri fk_ldt_hsdt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT fk_ldt_hsdt FOREIGN KEY (ho_so_dieu_tri_id) REFERENCES public.ho_so_dieu_tri(id) ON DELETE SET NULL;


--
-- Name: lich_lam_viec fk_llv_phong; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_lam_viec
    ADD CONSTRAINT fk_llv_phong FOREIGN KEY (phong_id) REFERENCES public.phong(id) ON DELETE SET NULL;


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
-- Name: lich_dat lich_dat_ky_thuat_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_ky_thuat_vien_id_fkey FOREIGN KEY (bac_si_id) REFERENCES public.chuyen_gia_y_te(id);


--
-- Name: lich_dat lich_dat_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


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
-- Name: lich_lam_viec lich_lam_viec_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_lam_viec
    ADD CONSTRAINT lich_lam_viec_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id) ON DELETE SET NULL;


--
-- Name: nguoi_dung nguoi_dung_vai_tro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT nguoi_dung_vai_tro_id_fkey FOREIGN KEY (vai_tro_id) REFERENCES public.vai_tro(id);


--
-- Name: refresh_tokens refresh_tokens_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id) ON DELETE CASCADE;


--
-- Name: thanh_toan thanh_toan_hoa_don_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanh_toan
    ADD CONSTRAINT thanh_toan_hoa_don_id_fkey FOREIGN KEY (hoa_don_id) REFERENCES public.hoa_don(id);


--
-- Name: thiet_bi_y_te thiet_bi_y_te_phong_id_hien_tai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thiet_bi_y_te
    ADD CONSTRAINT thiet_bi_y_te_phong_id_hien_tai_fkey FOREIGN KEY (phong_id_hien_tai) REFERENCES public.phong(id) ON DELETE SET NULL;


--
-- Name: thong_bao thong_bao_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id) ON DELETE CASCADE;


--
-- Name: thong_bao thong_bao_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id) ON DELETE CASCADE;


--
-- Name: voucher voucher_tao_boi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_tao_boi_fkey FOREIGN KEY (tao_boi) REFERENCES public.nguoi_dung(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict ELGusdghGeXocWcblc2Rwq0pWVatbKAG5xSBf8OFsbwSvQ8wqgU0CsZGFEUqCja

