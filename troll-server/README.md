## New Branch Details

* Will create new hate speech classification model and upload config + model.h5 files

# Folder Structure

## model

Must contain `config.json` and `tf_model.h5`.

# Rasberry Pi 4

* Run `poetry install`
* Install tensorflow via the wheel directly to the system python folder.
* Make the system packages available to poetry by setting
  `include-system-site-packages = true` in `.venv/pyvenv.cfg`
* Make sure keras version is the same as tensorflow (`2.6.0`), otherwise there
  will be a duplicate metric error (see: https://stackoverflow.com/q/68970841).


