mb stop
mb --configfile imposters.ejs --allowInjection --logfile mb.log >> mb.out &
tail -f > /dev/null