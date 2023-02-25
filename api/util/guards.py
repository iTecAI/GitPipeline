from models.user import Session
from util.exceptions import *
from starlite import ASGIConnection, BaseRouteHandler
from pymongo.collection import Collection
import time

def is_logged_in(connection: ASGIConnection, _: BaseRouteHandler):
    if not "authorization" in connection.headers.keys():
        raise AuthenticationException()
    try:
        session: Session = Session.load(connection.app.state.database, id=connection.headers["authorization"])
    except KeyError:
        raise AuthenticationException()
    
    collection: Collection = connection.app.state.database[session.COLLECTION]
    
    if time.time() > session.last_interaction + session.SESSION_TIMEOUT:
        collection.delete_one({"id": session.id})
        raise AuthenticationException()
    
    session.last_interaction = time.time()
    session.save()