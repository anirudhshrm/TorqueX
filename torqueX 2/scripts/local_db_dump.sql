--
-- PostgreSQL database dump
--

\restrict v5m3grScEnheQTmu5kUeeDI9qmTguLs5KI0fqcDR6ZJF9Me50Szosko9NgaXbeN

-- Dumped from database version 17.6 (Homebrew)
-- Dumped by pg_dump version 17.6 (Homebrew)

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Status" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."Status" OWNER TO postgres;

--
-- Name: VehicleRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VehicleRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."VehicleRequestStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "vehicleId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status public."Status" DEFAULT 'PENDING'::public."Status" NOT NULL,
    "totalPrice" double precision NOT NULL,
    "paymentIntentId" text,
    "paymentMethod" text,
    "promoCode" text
);


ALTER TABLE public."Booking" OWNER TO postgres;

--
-- Name: Broadcast; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Broadcast" (
    id text NOT NULL,
    "adminId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "userTarget" text DEFAULT 'ALL'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Broadcast" OWNER TO postgres;

--
-- Name: Deal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Deal" (
    id text NOT NULL,
    title text NOT NULL,
    code text NOT NULL,
    "codeHash" text NOT NULL,
    description text NOT NULL,
    "discountType" text DEFAULT 'percentage'::text NOT NULL,
    "discountValue" double precision NOT NULL,
    "minPurchase" double precision,
    "validFrom" timestamp(3) without time zone NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL,
    "usageLimit" integer,
    "currentUsage" integer DEFAULT 0 NOT NULL,
    "vehicleType" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Deal" OWNER TO postgres;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "userId" text NOT NULL,
    "vehicleId" text NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "clerkId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    phone text,
    address text,
    "passwordHash" text,
    "passwordSalt" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Vehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Vehicle" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    specs jsonb NOT NULL,
    "pricePerDay" double precision NOT NULL,
    availability boolean DEFAULT true NOT NULL,
    images text[],
    description text,
    features text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Vehicle" OWNER TO postgres;

--
-- Name: VehicleRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VehicleRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    type text NOT NULL,
    description text,
    status public."VehicleRequestStatus" DEFAULT 'PENDING'::public."VehicleRequestStatus" NOT NULL,
    "adminComment" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VehicleRequest" OWNER TO postgres;

--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Booking" (id, "userId", "vehicleId", "startDate", "endDate", status, "totalPrice", "paymentIntentId", "paymentMethod", "promoCode") FROM stdin;
6963431a-9ddf-42dc-88a3-d3f454ff2b74	42b2d573-2bc0-406d-8910-0e62bb7686fb	4547ce46-5050-4ae3-8392-ec0a55b19acb	2025-11-28 03:14:00	2025-12-01 03:14:00	PENDING	900	pi_3SV1rK3bBNWaXpmw14BMnqYa	\N	\N
351d8795-d86b-4376-b758-64957e854065	bb7efce8-d2cc-4d52-b235-4467c27d1acc	4547ce46-5050-4ae3-8392-ec0a55b19acb	2026-01-01 03:59:00	2026-01-22 03:59:00	PENDING	6300	pi_3SUg503bBNWaXpmw1LEoN8vZ	\N	\N
5f0d2ecc-38c6-4734-b888-20e9431227a9	42b2d573-2bc0-406d-8910-0e62bb7686fb	44b44976-a366-4f17-9dc2-e86fce81e44d	2025-11-27 06:27:00	2025-12-11 06:27:00	PENDING	1680	pi_3SV4rx3bBNWaXpmw0BJZ7pSf	\N	\N
7bad47ed-b675-4ab2-a9aa-4c0ad8d5caee	bb7efce8-d2cc-4d52-b235-4467c27d1acc	7949eb19-a4e9-4608-9a77-4fe29369cd5a	2025-11-21 03:14:00	2025-11-29 03:14:00	CANCELLED	880	pi_3SUfND3bBNWaXpmw1PgRF2yN	\N	\N
7350fb85-7312-416c-b4e2-72d8cffddbe4	bb7efce8-d2cc-4d52-b235-4467c27d1acc	ed5e2b54-19fe-4b54-aea9-60c8c4459595	2025-11-20 03:31:00	2025-11-29 03:31:00	CANCELLED	1170	pi_3SUfeI3bBNWaXpmw1CV089cR	\N	\N
ecf04a48-43b8-4605-af9b-e3fa42d54d0e	42b2d573-2bc0-406d-8910-0e62bb7686fb	4547ce46-5050-4ae3-8392-ec0a55b19acb	2025-11-19 03:35:00	2025-11-30 03:35:00	CANCELLED	3300	pi_3SUfhs3bBNWaXpmw0YkvTPGe	\N	\N
fce59c6e-869e-46df-8fb5-0cd51e126b4e	42b2d573-2bc0-406d-8910-0e62bb7686fb	4547ce46-5050-4ae3-8392-ec0a55b19acb	2025-12-01 03:35:00	2025-12-12 03:35:00	COMPLETED	3300	pi_3SUfjA3bBNWaXpmw1qreFWsB	\N	\N
\.


--
-- Data for Name: Broadcast; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Broadcast" (id, "adminId", title, message, "userTarget", "createdAt") FROM stdin;
e2900cf7-3765-4f36-9b57-427d0cb78509	42b2d573-2bc0-406d-8910-0e62bb7686fb	test	test	ALL	2025-11-17 09:15:27.615
d8dce292-6645-4fcb-93e0-2fa3df99b34f	42b2d573-2bc0-406d-8910-0e62bb7686fb	Redis Added	Now the app will work smooth	ALL	2025-11-17 09:33:34.548
45395d16-337d-43db-8bb9-1bd79238de91	42b2d573-2bc0-406d-8910-0e62bb7686fb	ljbn	jkb	ALL	2025-11-17 09:36:14.356
4b023fdc-82dc-442c-8f99-55b1aa6dc6ea	42b2d573-2bc0-406d-8910-0e62bb7686fb	New Vehicles Added!	Check out our latest collection of premium vehicles now available for booking.	ALL	2025-11-17 10:00:58.143
78e7fbb7-241d-4232-ad1f-04f8a386219a	42b2d573-2bc0-406d-8910-0e62bb7686fb	Special Weekend Offer	Book any vehicle this weekend and get 20% off! Limited time offer.	ALL	2025-11-17 10:00:58.145
7b7adec8-a901-4bb0-9245-f9f30e29ea5b	42b2d573-2bc0-406d-8910-0e62bb7686fb	Redis Caching Enabled	Our platform now uses Redis for faster performance and better user experience!	ALL	2025-11-17 10:00:58.146
96385842-957a-47f8-8b1d-1f928a4d48a6	42b2d573-2bc0-406d-8910-0e62bb7686fb	New Announcement	kya haal bai ke	ALL	2025-11-18 04:07:04.969
a50a1ff2-03e1-484e-a482-a0ea7970de62	42b2d573-2bc0-406d-8910-0e62bb7686fb	All Ready	good to go ig	ALL	2025-11-19 03:12:48.484
\.


--
-- Data for Name: Deal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Deal" (id, title, code, "codeHash", description, "discountType", "discountValue", "minPurchase", "validFrom", "validUntil", "usageLimit", "currentUsage", "vehicleType", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Review" (id, "bookingId", "userId", "vehicleId", rating, comment, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "clerkId", name, email, role, phone, address, "passwordHash", "passwordSalt", "createdAt") FROM stdin;
42b2d573-2bc0-406d-8910-0e62bb7686fb	manual-admin-1763350745109	Admin User	admin@torquex.com	ADMIN	\N	\N	1dc81cdba3f0ac72207fd5066e1d25b40915c3838feffd51c77e41a6570d6e53ebbed37c9b9b8e80c5f28961e13eb4e21626aae86b19d18d9f05498895ffe007	2ae421d09d8b51cbb41509aa0c877487	2025-11-17 03:39:05.117
bb7efce8-d2cc-4d52-b235-4467c27d1acc	manual-1763392172808-81moto8bxfd	testuser	testuser@example.com	USER	74ade3b0f6f0222ce82f8ad2$79fe78fff041351a91db4bc093a16eeb$bd254de822029d2cd7fde3a22fefd0ea	\N	9ba02ed17f0cbea1bfa60156825b37ca18479385292790be1de513b9c7d37a8de06a520cb7d19d5dd2a589f6caad31bf4206c1cedc8a2210b2fe9324c56ac1cf	ca5449777f09a1aa9f934811d0c06a8a	2025-11-17 15:09:32.859
d24ad07c-a47f-47cf-86d1-6bb51767fd8d	manual-1763522332364-48sdck7bbpo	user	user@torquex.com	USER	868587c1ea46188490f20102$092534fd32e4280e16320afb71824751$5491bbd0480f5ab6b5f28353ad8cc046	\N	776e92aae53c398233eda01c4036e819b895d19dedb2da1f1138c573748c5152478094c7aeb292f66e762e6cbc3b8d1ca9e53e26d83a428b29e5bbc6f31d8dce	5dec0fb6e5bef13747908edb227fe5cd	2025-11-19 03:18:52.406
e9a4f8dd-1ab1-41d7-b973-2d377f61085f	manual-1763531334686-9w8oolot3j	Rahul	rahul@gmail.com	USER	\N	\N	8e04a9c4b229bf52eb3d4c4c7177737b6738d7c868eeb5215c6a66b0408874dc6605c22a76291fcba7aaf30d6dd5537aca3f3a75086a5276c8104b47e9fe01ea	e000ba1ed834c1ecb451d00827b4509d	2025-11-19 05:48:54.738
\.


--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Vehicle" (id, name, type, specs, "pricePerDay", availability, images, description, features, "createdAt") FROM stdin;
44b44976-a366-4f17-9dc2-e86fce81e44d	Tesla Model 3	Sedan	{}	120	t	{https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80,https://images.unsplash.com/photo-1561580125-028ee3bd62eb?w=800&q=80}	Electric sedan with autopilot, premium interior, and exceptional performance. Zero emissions, instant acceleration.	{}	2025-11-18 01:05:50.527
3752634b-956d-4d06-9ed2-09322b48a944	BMW X5	SUV	{}	150	t	{https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80,https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80}	Luxury SUV with spacious interior, advanced safety features, and powerful engine. Perfect for family trips.	{}	2025-11-18 01:05:50.552
49fb7ddb-0b5b-4e66-b89f-015ecfca7c76	Mercedes-Benz C-Class	Sedan	{}	140	t	{https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80,https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80}	Premium sedan with elegant design, cutting-edge technology, and superior comfort. Ultimate luxury experience.	{}	2025-11-18 01:05:50.553
4547ce46-5050-4ae3-8392-ec0a55b19acb	Porsche 911	Sports Car	{}	300	t	{https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80,https://images.unsplash.com/photo-1614162692292-7ac56d7f4eab?w=800&q=80}	Iconic sports car with thrilling performance, precision handling, and timeless design. Pure driving excitement.	{}	2025-11-18 01:05:50.554
83807899-ade0-4cfd-ac41-ba68cfa5c221	Range Rover Sport	SUV	{}	200	t	{https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80,https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80}	Luxury off-road SUV with commanding presence, refined interior, and exceptional versatility. Adventure ready.	{}	2025-11-18 01:05:50.555
7949eb19-a4e9-4608-9a77-4fe29369cd5a	Lexus ES 350	Sedan	{}	110	t	{https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80,https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80}	Refined luxury sedan with exceptional reliability, quiet cabin, and smooth ride. Japanese craftsmanship.	{}	2025-11-18 01:05:50.557
ed5e2b54-19fe-4b54-aea9-60c8c4459595	Jeep Wrangler	SUV	{}	130	t	{https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80,https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80}	Legendary off-roader with removable doors, rugged capability, and iconic design. Built for adventure.	{}	2025-11-18 01:05:50.558
ac74b8ac-3582-407f-84b9-40d522e50fa0	Chevrolet Corvette	Sports Car	{}	250	t	{https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80,https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80}	Mid-engine supercar with stunning performance, aggressive looks, and incredible value. American dream machine.	{}	2025-11-18 01:05:50.559
\.


--
-- Data for Name: VehicleRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VehicleRequest" (id, "userId", make, model, year, type, description, status, "adminComment", "createdAt", "updatedAt") FROM stdin;
813b4a50-fa41-4978-9fed-625f19c268ad	bb7efce8-d2cc-4d52-b235-4467c27d1acc	Range Rover	Velar	2024	SUV	Looking for a luxury Range Rover Velar for a 2-week vacation trip. Prefer black or white color with all premium features. Needed in 7 days.	APPROVED	Request approved. We will contact you shortly to finalize the details and arrange the vehicle.	2025-11-18 01:24:23.912	2025-11-18 01:24:43.996
6c2c7dab-ac24-4b80-8b0a-efc23eec2310	bb7efce8-d2cc-4d52-b235-4467c27d1acc	Lamborghini	Huracán	2023	Sports	Need a Lamborghini Huracán for a special weekend event. Must have full insurance coverage and delivery service. Needed in 2 weeks.	APPROVED	Request approved. We will contact you shortly to finalize the details and arrange the vehicle.	2025-11-18 01:24:23.92	2025-11-18 01:24:44.003
\.


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: Broadcast Broadcast_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Broadcast"
    ADD CONSTRAINT "Broadcast_pkey" PRIMARY KEY (id);


--
-- Name: Deal Deal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VehicleRequest VehicleRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VehicleRequest"
    ADD CONSTRAINT "VehicleRequest_pkey" PRIMARY KEY (id);


--
-- Name: Vehicle Vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_pkey" PRIMARY KEY (id);


--
-- Name: Deal_codeHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Deal_codeHash_key" ON public."Deal" USING btree ("codeHash");


--
-- Name: Deal_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Deal_code_key" ON public."Deal" USING btree (code);


--
-- Name: User_clerkId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_clerkId_key" ON public."User" USING btree ("clerkId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Booking Booking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_vehicleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES public."Vehicle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_vehicleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES public."Vehicle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VehicleRequest VehicleRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VehicleRequest"
    ADD CONSTRAINT "VehicleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict v5m3grScEnheQTmu5kUeeDI9qmTguLs5KI0fqcDR6ZJF9Me50Szosko9NgaXbeN

