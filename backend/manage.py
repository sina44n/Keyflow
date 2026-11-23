#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import subprocess
from pathlib import Path


def _ensure_virtualenv():
    """
    If invoked outside an active virtual environment and a local .venv exists,
    transparently re-executes using the project virtual environment.
    Guarantees required packages (pyjwt, psycopg, cryptography) are available.
    """
    if sys.prefix == sys.base_prefix and not os.environ.get('_KEYFLOW_VENV_ACTIVATED'):
        base_dir = Path(__file__).resolve().parent
        venv_py = (
            base_dir / '.venv' / 'Scripts' / 'python.exe'
            if os.name == 'nt'
            else base_dir / '.venv' / 'bin' / 'python'
        )
        if venv_py.exists():
            os.environ['_KEYFLOW_VENV_ACTIVATED'] = '1'
            res = subprocess.call([str(venv_py)] + sys.argv)
            sys.exit(res)


def main():
    """Run administrative tasks."""
    _ensure_virtualenv()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keyflow.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
