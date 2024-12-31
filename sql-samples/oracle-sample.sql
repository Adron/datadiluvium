-- Oracle specific DDL example
CREATE SEQUENCE customers_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

CREATE TABLE customers (
    customer_id NUMBER(10) DEFAULT customers_seq.NEXTVAL,
    account_number VARCHAR2(20) NOT NULL,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    email VARCHAR2(255),
    created_date TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP,
    last_modified TIMESTAMP(6) WITH TIME ZONE,
    status NUMBER(1) DEFAULT 1,
    CONSTRAINT pk_customers PRIMARY KEY (customer_id)
)
TABLESPACE users
STORAGE (
    INITIAL 1M
    NEXT 1M
    PCTINCREASE 0
    MINEXTENTS 1
    MAXEXTENTS UNLIMITED
)
NOLOGGING;

-- Oracle-specific index options
CREATE INDEX idx_customers_email
    ON customers(email)
    TABLESPACE users
    COMPRESS 1
    NOLOGGING;

CREATE TABLE orders (
    order_id NUMBER(10),
    customer_id NUMBER(10) NOT NULL,
    order_date TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP,
    total_amount NUMBER(19,4) NOT NULL,
    order_status VARCHAR2(20) DEFAULT 'PENDING',
    CONSTRAINT pk_orders PRIMARY KEY (order_id),
    CONSTRAINT fk_orders_customers FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE
) ORGANIZATION INDEX;

-- Oracle-specific materialized view with refresh options
CREATE MATERIALIZED VIEW mv_customer_orders
BUILD IMMEDIATE
REFRESH FAST ON COMMIT
ENABLE QUERY REWRITE
AS
SELECT 
    c.customer_id,
    c.account_number,
    COUNT(o.order_id) as order_count,
    SUM(o.total_amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.account_number;

-- Oracle PL/SQL package
CREATE OR REPLACE PACKAGE order_management AS
    -- Custom type definitions
    TYPE order_item_rec IS RECORD (
        product_id NUMBER(10),
        quantity NUMBER(10),
        unit_price NUMBER(19,4)
    );
    
    TYPE order_items_tbl IS TABLE OF order_item_rec;
    
    -- Package procedures and functions
    PROCEDURE create_order(
        p_customer_id IN NUMBER,
        p_order_items IN order_items_tbl,
        p_order_id OUT NUMBER
    );
    
    FUNCTION get_customer_total_spent(
        p_customer_id IN NUMBER
    ) RETURN NUMBER;
END order_management;
/

CREATE OR REPLACE PACKAGE BODY order_management AS
    PROCEDURE create_order(
        p_customer_id IN NUMBER,
        p_order_items IN order_items_tbl,
        p_order_id OUT NUMBER
    ) IS
        v_total_amount NUMBER(19,4) := 0;
    BEGIN
        -- Calculate total amount
        FOR i IN 1..p_order_items.COUNT LOOP
            v_total_amount := v_total_amount + 
                (p_order_items(i).quantity * p_order_items(i).unit_price);
        END LOOP;
        
        -- Get next order ID
        SELECT orders_seq.NEXTVAL INTO p_order_id FROM DUAL;
        
        -- Insert order
        INSERT INTO orders (
            order_id,
            customer_id,
            total_amount
        ) VALUES (
            p_order_id,
            p_customer_id,
            v_total_amount
        );
        
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END create_order;
    
    FUNCTION get_customer_total_spent(
        p_customer_id IN NUMBER
    ) RETURN NUMBER IS
        v_total NUMBER(19,4);
    BEGIN
        SELECT NVL(SUM(total_amount), 0)
        INTO v_total
        FROM orders
        WHERE customer_id = p_customer_id;
        
        RETURN v_total;
    END get_customer_total_spent;
END order_management;
/ 