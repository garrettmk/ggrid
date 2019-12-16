# ggrid
A window tiling extension for Gnome.

### Install
Clone the repo:
>`git clone https://github.com/garrettmk/ggrid`

Create links:
>`ln -s ./ggrid ~/.local/share/gnome-shell/extensions/ggrid@garrettmk`
>`sudo ln -s ./ggrid/schemas/org.gnome.shell.extensions.ggrid.schema.xml /usr/share/glib-2.0/schemas/`


### Uninstall
Simply remove the repo directory:
>`rm -rf ./ggrid`


### Changing settings
Settings can be changed using `gsettings`, or `dconf` if you prefer a GUI. For example, the full list of settings
can be viewed with the following command:

>`gsettings list-keys org.gnome.shell.extensions.ggrid`

To set the grid to use 12 columns:
>`gsettings set org.gnome.shell.extensions.ggrid grid-columns 12`
