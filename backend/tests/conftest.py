import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from main import app
from dependencies import get_db
from auth import hash_password

TEST_DATABASE_URL = "sqlite:///./test_lionel.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    from database import User
    user = User(
        email="admin@test.com",
        password_hash=hash_password("admin123"),
        name="Admin User",
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    response = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    return response.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def member_user(db):
    from database import User
    user = User(
        email="member@test.com",
        password_hash=hash_password("member123"),
        name="Member User",
        role="member",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def member_token(client, member_user):
    response = client.post("/api/auth/login", json={"email": "member@test.com", "password": "member123"})
    return response.json()["access_token"]


@pytest.fixture
def member_headers(member_token):
    return {"Authorization": f"Bearer {member_token}"}
