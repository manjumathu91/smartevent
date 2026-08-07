from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db, cache
from models import Category

categories_bp = Blueprint("categories", __name__)


# ==========================================
# GET ALL CATEGORIES
# ==========================================
@categories_bp.route("/", methods=["GET"])
@cache.cached(timeout=60)
def get_categories():
    """
    Get all categories with pagination & search
    """

    search = request.args.get("search", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    query = Category.query

    if search:
        query = query.filter(
            Category.name.ilike(f"%{search}%")
        )

    pagination = query.order_by(Category.name.asc()).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    categories = []

    for category in pagination.items:
        categories.append(category.to_dict())

    return jsonify({
        "success": True,
        "categories": categories,
        "pagination": {
            "page": pagination.page,
            "pages": pagination.pages,
            "total": pagination.total,
            "per_page": pagination.per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200


# ==========================================
# GET SINGLE CATEGORY
# ==========================================
@categories_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id):

    category = Category.query.get(category_id)

    if not category:
        return jsonify({
            "success": False,
            "message": "Category not found"
        }), 404

    return jsonify({
        "success": True,
        "category": category.to_dict()
    }), 200


# ==========================================
# SEARCH CATEGORY
# ==========================================
@categories_bp.route("/search", methods=["GET"])
def search_category():

    keyword = request.args.get("q", "").strip()

    if keyword == "":
        return jsonify({
            "success": False,
            "message": "Search keyword is required"
        }), 400

    categories = Category.query.filter(
        Category.name.ilike(f"%{keyword}%")
    ).all()

    return jsonify({
        "success": True,
        "count": len(categories),
        "categories": [
            category.to_dict()
            for category in categories
        ]
    }), 200


# ==========================================
# CATEGORY DROPDOWN
# ==========================================
@categories_bp.route("/dropdown", methods=["GET"])
def category_dropdown():

    categories = Category.query.order_by(
        Category.name.asc()
    ).all()

    data = []

    for category in categories:
        data.append({
            "id": category.id,
            "name": category.name
        })

    return jsonify({
        "success": True,
        "categories": data
    }), 200

# ==========================================
# ADD CATEGORY (ADMIN)
# ==========================================
@categories_bp.route("/", methods=["POST"])
@jwt_required()
def add_category():

    from flask_jwt_extended import get_jwt_identity
    from models import User, ActivityLog

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    if user.role != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if name == "":
        return jsonify({
            "success": False,
            "message": "Category name is required"
        }), 400

    exists = Category.query.filter_by(name=name).first()

    if exists:
        return jsonify({
            "success": False,
            "message": "Category already exists"
        }), 400

    category = Category(
        name=name,
        description=description
    )

    db.session.add(category)
    db.session.commit()

    log = ActivityLog(
        user_id=user.id,
        action="create_category",
        resource_type="category",
        resource_id=category.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent")
    )

    db.session.add(log)
    db.session.commit()

    cache.clear()

    return jsonify({
        "success": True,
        "message": "Category created successfully",
        "category": category.to_dict()
    }), 201


# ==========================================
# UPDATE CATEGORY (ADMIN)
# ==========================================
@categories_bp.route("/<int:category_id>", methods=["PUT"])
@jwt_required()
def update_category(category_id):

    from flask_jwt_extended import get_jwt_identity
    from models import User, ActivityLog

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    if user.role != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    category = Category.query.get(category_id)

    if not category:
        return jsonify({
            "success": False,
            "message": "Category not found"
        }), 404

    data = request.get_json()

    if "name" in data:

        name = data["name"].strip()

        duplicate = Category.query.filter(
            Category.name == name,
            Category.id != category.id
        ).first()

        if duplicate:
            return jsonify({
                "success": False,
                "message": "Category already exists"
            }), 400

        category.name = name

    if "description" in data:
        category.description = data["description"].strip()

    db.session.commit()

    log = ActivityLog(
        user_id=user.id,
        action="update_category",
        resource_type="category",
        resource_id=category.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent")
    )

    db.session.add(log)
    db.session.commit()

    cache.clear()

    return jsonify({
        "success": True,
        "message": "Category updated successfully",
        "category": category.to_dict()
    }), 200


# ==========================================
# DELETE CATEGORY (ADMIN)
# ==========================================
@categories_bp.route("/<int:category_id>", methods=["DELETE"])
@jwt_required()
def delete_category(category_id):

    from flask_jwt_extended import get_jwt_identity
    from models import User, ActivityLog

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    if user.role != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    category = Category.query.get(category_id)

    if not category:
        return jsonify({
            "success": False,
            "message": "Category not found"
        }), 404

    db.session.delete(category)
    db.session.commit()

    log = ActivityLog(
        user_id=user.id,
        action="delete_category",
        resource_type="category",
        resource_id=category_id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent")
    )

    db.session.add(log)
    db.session.commit()

    cache.clear()

    return jsonify({
        "success": True,
        "message": "Category deleted successfully"
    }), 200

# ==========================================
# CATEGORY STATISTICS
# ==========================================
@categories_bp.route("/stats", methods=["GET"])
@jwt_required()
def category_statistics():

    total_categories = Category.query.count()

    categories = Category.query.order_by(Category.name.asc()).all()

    stats = []

    for category in categories:

        event_count = len(category.events)

        stats.append({
            "id": category.id,
            "name": category.name,
            "total_events": event_count
        })

    return jsonify({
        "success": True,
        "total_categories": total_categories,
        "statistics": stats
    }), 200


# ==========================================
# CATEGORY EVENT COUNT
# ==========================================
@categories_bp.route("/<int:category_id>/events-count", methods=["GET"])
def category_event_count(category_id):

    category = Category.query.get(category_id)

    if not category:
        return jsonify({
            "success": False,
            "message": "Category not found"
        }), 404

    return jsonify({
        "success": True,
        "category": category.name,
        "event_count": len(category.events)
    }), 200


# ==========================================
# ACTIVE CATEGORIES
# ==========================================
@categories_bp.route("/active", methods=["GET"])
def active_categories():

    categories = Category.query.order_by(Category.name.asc()).all()

    data = []

    for category in categories:

        if len(category.events) > 0:
            data.append(category.to_dict())

    return jsonify({
        "success": True,
        "count": len(data),
        "categories": data
    }), 200


# ==========================================
# CLEAR CATEGORY CACHE
# ==========================================
@categories_bp.route("/clear-cache", methods=["POST"])
@jwt_required()
def clear_category_cache():

    from flask_jwt_extended import get_jwt_identity
    from models import User

    user = User.query.get(int(get_jwt_identity()))

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    if user.role != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    cache.clear()

    return jsonify({
        "success": True,
        "message": "Category cache cleared successfully"
    }), 200


# ==========================================
# CATEGORY HEALTH CHECK
# ==========================================
@categories_bp.route("/health", methods=["GET"])
def category_health():

    return jsonify({
        "success": True,
        "module": "Categories",
        "status": "Running",
        "version": "1.0.0"
    }), 200