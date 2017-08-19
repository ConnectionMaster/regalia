def go_direction(direction)
  page.find(".compass-direction[data-direction=\"#{direction}\"]").click
end

def continue_until_unpaused
  while (continue_button = page.all('#Continue', visible: true)[0])
    click_on 'Continue'
  end
end

def click_on_character(character)
  page.find(".VisibleCharacters", text: character).click
end

def click_on_object(object)
  page.find(".RoomObjects", text: object).click
end

def act_on_object(object, action)
  click_on_object(object)
  choose_action(action)
end

def act_on_character(character, action)
  click_on_character(character)
  choose_action(action)
end

def choose_action(action)
  within '#Actionchoices' do
    page.find(".ActionChoices", text: action, match: :first).click
  end
end

def choose_input_action(action)
  page.find('.inputchoices', text: action).click
end

def set_game_variable(name, value)
  page.evaluate_script("TheGame.Variables.filter(function (v) { return v.varname === '#{name}' })[0].dNumType = #{value}")
end

def export_savegames
  click_on 'save'
  accept_alert do
    accept_prompt(with: 'rspec save') do
      click_on 'Create a New Save'
    end
  end
  click_on 'save'
  now_string = DateTime.now.strftime('%Y-%m-%d-%H-%M-%S')
  filename = "rspec_save_#{now_string}.json"
  File.write(filename, page.evaluate_script('retrieveExportData()'))

  puts "Exported saves as #{filename}"
  exit 0
end

def import_savegames
  page.evaluate_script("SavedGames.import(#{File.read(ENV.fetch('IMPORT_FILE'))})")
  click_on 'load'
  accept_alert do
    within '.load-menu' do
      click_on 'Load'
    end
  end
end