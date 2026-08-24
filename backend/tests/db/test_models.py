import pytest
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

from app.db.models import Customer, Product, Order, OrderItem, CustomerSegment, ModelRegistry, Cancellation


def test_customer_external_id_unique(db_session):
    db_session.add(Customer(external_id="C001", country="United Kingdom"))
    db_session.commit()
    db_session.add(Customer(external_id="C001", country="Germany"))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_order_requires_valid_customer_fk(db_session):
    bad_order = Order(
        invoice_no="INV1",
        customer_id=999,  # does not exist
        order_date=datetime.now(timezone.utc),
    )
    db_session.add(bad_order)
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_order_customer_id_nullable(db_session):
    # 22.77% of source rows have no Customer ID — must be allowed (Phase 0 finding)
    order = Order(invoice_no="INV2", customer_id=None, order_date=datetime.now(timezone.utc))
    db_session.add(order)
    db_session.commit()
    assert order.id is not None
    assert order.customer_id is None


def test_customer_segment_composite_pk_allows_multiple_versions(db_session):
    customer = Customer(external_id="C002")
    db_session.add(customer)
    db_session.commit()

    db_session.add(CustomerSegment(customer_id=customer.id, model_version="v1", segment_label="High Value"))
    db_session.add(CustomerSegment(customer_id=customer.id, model_version="v2", segment_label="At Risk"))
    db_session.commit()  # should NOT raise — different model_version

    rows = db_session.query(CustomerSegment).filter_by(customer_id=customer.id).all()
    assert len(rows) == 2


def test_customer_segment_duplicate_version_rejected(db_session):
    customer = Customer(external_id="C003")
    db_session.add(customer)
    db_session.commit()

    db_session.add(CustomerSegment(customer_id=customer.id, model_version="v1", segment_label="High Value"))
    db_session.commit()

    db_session.add(CustomerSegment(customer_id=customer.id, model_version="v1", segment_label="Different"))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_model_registry_unique_name_version(db_session):
    db_session.add(
        ModelRegistry(
            model_name="purchase_classifier",
            version="v1",
            metrics={"f1": 0.78},
            artifact_path="/models/purchase_v1.joblib",
            is_active=True,
        )
    )
    db_session.commit()

    db_session.add(
        ModelRegistry(
            model_name="purchase_classifier",
            version="v1",
            metrics={"f1": 0.61},
            artifact_path="/models/purchase_v1_dup.joblib",
            is_active=False,
        )
    )
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_order_item_links_order_and_product(db_session):
    customer = Customer(external_id="C004")
    product = Product(external_id="85123A", description="WHITE HANGING HEART T-LIGHT HOLDER")
    db_session.add_all([customer, product])
    db_session.commit()

    order = Order(invoice_no="INV3", customer_id=customer.id, order_date=datetime.now(timezone.utc))
    db_session.add(order)
    db_session.commit()

    item = OrderItem(order_id=order.id, product_id=product.id, quantity=10, unit_price=2.55, line_revenue=25.50)
    db_session.add(item)
    db_session.commit()

    assert item.id is not None
    assert order.items[0].product.external_id == "85123A"


def test_order_item_line_revenue_matches_quantity_times_price(db_session):
    customer = Customer(external_id="C005")
    product = Product(external_id="22041")
    db_session.add_all([customer, product])
    db_session.commit()
    order = Order(invoice_no="INV4", customer_id=customer.id, order_date=datetime.now(timezone.utc))
    db_session.add(order)
    db_session.commit()

    qty, price = 3, 2.10
    item = OrderItem(order_id=order.id, product_id=product.id, quantity=qty, unit_price=price, line_revenue=qty * price)
    db_session.add(item)
    db_session.commit()
    assert round(float(item.line_revenue), 2) == round(qty * price, 2)


def test_cancellation_allows_missing_customer_id(db_session):
    # Cancellations must not require FK — rows may have missing/filtered identifiers (Phase 0)
    c = Cancellation(
        external_invoice_id="C536379",
        stock_code="D",
        description="Discount",
        customer_external_id=None,
        invoice_date=datetime.now(timezone.utc),
        quantity=-1,
        unit_price=27.50,
        country="United Kingdom",
        cancellation_type="C_INVOICE",
    )
    db_session.add(c)
    db_session.commit()
    assert c.id is not None
    assert c.customer_external_id is None


def test_customer_updated_at_present(db_session):
    customer = Customer(external_id="C006")
    db_session.add(customer)
    db_session.commit()
    assert customer.created_at is not None
    assert customer.updated_at is not None


def test_product_updated_at_present(db_session):
    product = Product(external_id="99999")
    db_session.add(product)
    db_session.commit()
    assert product.created_at is not None
    assert product.updated_at is not None


def test_order_has_no_is_cancelled_attribute():
    assert not hasattr(Order, "is_cancelled")
